import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Define public routes (no auth required)
  const publicRoutes = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/signup',
  ]

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))

  // Skip middleware if Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isPublicRoute) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Use getUser() instead of getSession() for consistency with layout
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log('[Proxy]', {
      pathname,
      hasUser: !!user,
      userId: user?.id,
      error: error?.message,
      isPublicRoute
    })

    // If there's an auth error, allow public routes, redirect others to login
    if (error) {
      console.error('[Proxy] Auth error:', error.message)
      if (isPublicRoute) {
        return supabaseResponse
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If not authenticated and trying to access protected route
    if (!user && !isPublicRoute) {
      console.log('[Proxy] No user, redirecting to /login')
      const redirectUrl = new URL('/login', request.url)
      // Preserve original URL for redirect after login
      if (pathname !== '/' && pathname !== '/login') {
        redirectUrl.searchParams.set('redirect', pathname)
      }
      return NextResponse.redirect(redirectUrl)
    }

    // If authenticated and trying to access auth pages, redirect to dashboard
    if (user && isPublicRoute && pathname !== '/auth/callback') {
      console.log('[Proxy] User authenticated on public route, redirecting to /dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    console.log('[Proxy] Allowing request to continue')
    return supabaseResponse
  } catch (error) {
    // If anything fails, allow public routes
    console.error('Proxy error:', error)
    if (isPublicRoute) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
