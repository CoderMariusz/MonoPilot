import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { API_CONFIG } from '../api/config';

/**
 * Session refresh threshold in seconds (10 minutes before expiry)
 * Tokens are refreshed proactively to prevent session expiration during user activity
 */
const REFRESH_THRESHOLD_SECONDS = 10 * 60;

/**
 * Check if a route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = ['/login', '/signup'];
  return publicRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if session needs refresh (within 10 minutes of expiry)
 */
function needsRefresh(session: any): boolean {
  if (!session?.expires_at) return false;

  const expiresAt = session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - now;

  return timeUntilExpiry < REFRESH_THRESHOLD_SECONDS && timeUntilExpiry > 0;
}

/**
 * Simplified session middleware
 *
 * Responsibilities:
 * 1. Check if user has valid session
 * 2. Refresh token if near expiry (< 10 min)
 * 3. Redirect to /login if no session on protected routes
 *
 * REMOVED (moved to page level):
 * - Role-based access control
 * - User profile fetching
 * - Complex expiry scenarios
 * - Role caching
 *
 * Benefits:
 * - No race conditions
 * - Easy to debug
 * - Single responsibility
 * - Better performance
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current session
  const { data: { session }, error } = await supabase.auth.getSession();

  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware - Path:', request.nextUrl.pathname, 'Session:', !!session);
  }

  // Allow public routes without session check
  if (isPublicRoute(request.nextUrl.pathname)) {
    return supabaseResponse;
  }

  // Redirect to login if no valid session
  if (error || !session) {
    const loginUrl = new URL('/login', request.url);

    // Preserve returnTo for redirect after login
    const returnToPath = request.nextUrl.pathname;
    if (returnToPath && /^\/[^\/]/.test(returnToPath)) {
      loginUrl.searchParams.set('returnTo', returnToPath);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Middleware - No session, redirecting to login');
    }

    return NextResponse.redirect(loginUrl);
  }

  // Refresh token if near expiry
  if (needsRefresh(session)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Middleware - Session near expiry, refreshing...');
    }

    try {
      const { error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('Middleware - Session refresh failed:', refreshError.message);

        // If refresh fails, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware - Session refreshed successfully');
      }
    } catch (err) {
      console.error('Middleware - Session refresh error:', err);

      // On error, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}
