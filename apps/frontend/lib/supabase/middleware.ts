import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { API_CONFIG } from '../api/config';

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

  // Try to refresh the session first
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();

  console.log('Middleware - Path:', request.nextUrl.pathname, 'User:', !!user, 'Session:', !!session);

  // Redirect unauthenticated users to login
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/signup')) {
    const loginUrl = new URL('/login', request.url);
    // Add returnTo parameter to remember where user was trying to go
    loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
    console.log('Middleware - Redirecting to login with returnTo:', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access for authenticated users
  if (user) {
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userProfile?.role) {
        console.log('Middleware - User role:', userProfile.role);
        
        // Define role-based access rules
        const roleAccess: Record<string, string[]> = {
          'Admin': ['/admin', '/planning', '/production', '/warehouse', '/technical', '/scanner', '/settings'],
          'Planner': ['/planning', '/production', '/warehouse'],
          'Operator': ['/production', '/scanner'],
          'Warehouse': ['/warehouse', '/scanner'],
          'QC': ['/warehouse', '/scanner'],
          'Technical': ['/technical', '/settings'],
          'Purchasing': ['/planning', '/warehouse']
        };

        const allowedPaths = roleAccess[userProfile.role] || [];
        const currentPath = request.nextUrl.pathname;
        
        // Check if user has access to current path
        const hasAccess = allowedPaths.some(path => currentPath.startsWith(path)) || 
                         currentPath === '/' || 
                         currentPath.startsWith('/login') || 
                         currentPath.startsWith('/signup');
        
        if (!hasAccess) {
          console.log('Middleware - Access denied for role:', userProfile.role, 'to path:', currentPath);
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('returnTo', currentPath);
          return NextResponse.redirect(loginUrl);
        }
      }
    } catch (error) {
      console.error('Middleware - Error checking user role:', error);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse;
}
