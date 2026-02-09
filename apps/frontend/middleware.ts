import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitRecord>()

/**
 * Extract client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  // Check various headers in order of preference
  const ip =
    (request.headers.get('x-forwarded-for')?.split(',')[0]) ||
    (request.headers.get('x-real-ip')) ||
    (request.headers.get('cf-connecting-ip')) ||
    (request.headers.get('x-client-ip')) ||
    '0.0.0.0'

  return ip.trim()
}

/**
 * Check if request is within rate limit (50 req/min per IP)
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const LIMIT = 50
  const WINDOW_MS = 60 * 1000 // 1 minute

  let record = rateLimitStore.get(ip)

  // If no record exists or window has expired, create new one
  if (!record || record.resetTime < now) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return true
  }

  // Increment count and check limit
  record.count++

  if (record.count > LIMIT) {
    return false // Rate limited
  }

  return true // Still within limit
}

/**
 * Cleanup old rate limit records (runs periodically)
 */
function cleanupRateLimits() {
  const now = Date.now()
  const keysToDelete: string[] = []

  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach(key => rateLimitStore.delete(key))
}

// Run cleanup every 2 minutes
if (typeof global !== 'undefined' && !(global as any).__rateLimitCleanupStarted) {
  (global as any).__rateLimitCleanupStarted = true
  setInterval(cleanupRateLimits, 2 * 60 * 1000)
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response: NextResponse): NextResponse {
  const origin = process.env.CORS_ORIGIN || 'http://localhost:3000'
  
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:")
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    addCorsHeaders(response)
    addSecurityHeaders(response)
    return response
  }

  // Apply rate limiting to API endpoints
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request)
    
    if (!checkRateLimit(ip)) {
      console.warn(`[RateLimit] IP ${ip} exceeded limit on ${pathname}`)
      const response = NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Window': '60',
          }
        }
      )
      addCorsHeaders(response)
      addSecurityHeaders(response)
      return response
    }

    // Allow API request to proceed and add headers
    const response = NextResponse.next()
    addCorsHeaders(response)
    addSecurityHeaders(response)
    return response
  }

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
        addSecurityHeaders(supabaseResponse)
        return supabaseResponse
      }
      const response = NextResponse.redirect(new URL('/login', request.url))
      addSecurityHeaders(response)
      return response
    }

    // If not authenticated and trying to access protected route
    if (!user && !isPublicRoute) {
      console.log('[Proxy] No user, redirecting to /login')
      const redirectUrl = new URL('/login', request.url)
      // Preserve original URL for redirect after login
      if (pathname !== '/' && pathname !== '/login') {
        redirectUrl.searchParams.set('redirect', pathname)
      }
      const response = NextResponse.redirect(redirectUrl)
      addSecurityHeaders(response)
      return response
    }

    // If authenticated and trying to access auth pages, redirect to dashboard
    if (user && isPublicRoute && pathname !== '/auth/callback') {
      console.log('[Proxy] User authenticated on public route, redirecting to /dashboard')
      const response = NextResponse.redirect(new URL('/dashboard', request.url))
      addSecurityHeaders(response)
      return response
    }

    console.log('[Proxy] Allowing request to continue')
    addSecurityHeaders(supabaseResponse)
    return supabaseResponse
  } catch (error) {
    // If anything fails, allow public routes
    console.error('Proxy error:', error)
    if (isPublicRoute) {
      const response = NextResponse.next()
      addSecurityHeaders(response)
      return response
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    addSecurityHeaders(response)
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
