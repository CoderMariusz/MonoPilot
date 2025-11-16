import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { API_CONFIG } from '../api/config';

/**
 * Session refresh threshold in seconds (10 minutes before expiry)
 * Tokens are refreshed proactively to prevent session expiration during user activity
 */
const REFRESH_THRESHOLD_SECONDS = 10 * 60;

/**
 * User role cache to avoid database queries on every request
 * Cache expires after 5 minutes to stay reasonably fresh
 */
const roleCache = new Map<string, { role: string; expiresAt: number }>();
const ROLE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get user role from cache or database
 * @param userId - User ID to fetch role for
 * @param supabase - Supabase client instance
 * @returns User role string or null
 */
async function getUserRole(userId: string, supabase: any): Promise<string | null> {
  const now = Date.now();
  const cached = roleCache.get(userId);

  // Return cached role if still valid
  if (cached && cached.expiresAt > now) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Middleware - User role (cached):', cached.role);
    }
    return cached.role;
  }

  // Fetch from database
  try {
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userProfile?.role) {
      // Cache the role
      roleCache.set(userId, {
        role: userProfile.role,
        expiresAt: now + ROLE_CACHE_TTL,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware - User role (from DB):', userProfile.role);
      }
      return userProfile.role;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Middleware - Error fetching user role:', error);
    }
  }

  return null;
}

/**
 * Updates and manages user session with automatic token refresh
 *
 * This middleware:
 * 1. Checks current session validity
 * 2. Automatically refreshes tokens 10 minutes before expiration
 * 3. Handles expired sessions gracefully with redirect to login
 * 4. Validates returnTo parameter to prevent open redirect attacks
 *
 * @param request - Next.js request object
 * @returns NextResponse with updated session cookies or redirect
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    API_CONFIG.supabaseUrl,
    API_CONFIG.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current session
  const { data: { session } } = await supabase.auth.getSession();

  // Check if session needs refresh (refresh before expiration to prevent interruption)
  let refreshedSession = session;
  if (session) {
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;

      // Scenario 1: Near expiry - refresh proactively (10 min before expiration)
      if (timeUntilExpiry < REFRESH_THRESHOLD_SECONDS && timeUntilExpiry > 0) {
        const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60);
        if (process.env.NODE_ENV === 'development') {
          console.log(`Middleware - Session expires in ${minutesUntilExpiry} min, refreshing...`);
        }

        try {
          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Middleware - Session refresh failed:', error.message);
            }
          } else if (data.session) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Middleware - Session refreshed successfully');
            }
            refreshedSession = data.session;
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Middleware - Session refresh error:', err);
          }
        }
      }
      // Scenario 2: Already expired - attempt refresh, fallback to redirect
      else if (timeUntilExpiry <= 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware - Session expired, attempting refresh...');
        }

        try {
          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Middleware - Session refresh failed for expired session:', error.message);
            }
            refreshedSession = null;
          } else if (data.session) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Middleware - Expired session refreshed successfully');
            }
            refreshedSession = data.session;
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Middleware - Session refresh error for expired session:', err);
          }
          refreshedSession = null;
        }
      }
    }
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware - Path:', request.nextUrl.pathname, 'User:', !!user, 'Session:', !!refreshedSession);
  }

  // Redirect to login if no valid user session
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/signup')) {
    const loginUrl = new URL('/login', request.url);

    // Validate returnTo parameter to prevent open redirect attacks
    // Only allow relative paths starting with / (not //)
    const returnToPath = request.nextUrl.pathname;
    if (returnToPath && /^\/[^\/]/.test(returnToPath)) {
      loginUrl.searchParams.set('returnTo', returnToPath);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Middleware - Redirecting to login with returnTo:', returnToPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    // Get user role from cache or database
    const userRole = await getUserRole(user.id, supabase);

    if (userRole) {
      const roleAccess: Record<string, string[]> = {
        'Admin': ['/admin', '/planning', '/production', '/warehouse', '/technical', '/scanner', '/settings'],
        'Planner': ['/planning', '/production', '/warehouse'],
        'Operator': ['/production', '/scanner'],
        'Warehouse': ['/warehouse', '/scanner'],
        'QC': ['/warehouse', '/scanner'],
        'Technical': ['/technical', '/settings'],
        'Purchasing': ['/planning', '/warehouse']
      };

      const allowedPaths = roleAccess[userRole] || [];
      const currentPath = request.nextUrl.pathname;

      const hasAccess = allowedPaths.some(path => currentPath.startsWith(path)) ||
                       currentPath === '/' ||
                       currentPath.startsWith('/login') ||
                       currentPath.startsWith('/signup');

      if (!hasAccess) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware - Access denied for role:', userRole, 'to path:', currentPath);
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnTo', currentPath);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return supabaseResponse;
}
