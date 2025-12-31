/**
 * CSRF Protection Utility
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * Provides origin validation for state-changing API requests (POST, PUT, DELETE, PATCH).
 * This is a defense-in-depth measure complementing Supabase's SameSite cookie settings.
 *
 * Security Model:
 * 1. Supabase auth cookies use SameSite=Lax by default (blocks cross-site POSTs)
 * 2. All state-changing routes require authentication (session must be valid)
 * 3. This origin check provides additional protection against subdomain attacks
 *
 * References:
 * - OWASP CSRF Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 * - ADR-013: Multi-tenant security patterns
 */

import { NextRequest } from 'next/server'

/**
 * Validate request origin against allowed origins.
 * Returns true if the origin is trusted, false otherwise.
 *
 * @param request - The incoming NextRequest object
 * @returns boolean - true if origin is valid, false otherwise
 */
export function validateOrigin(request: NextRequest): boolean {
  // In test environment, skip CSRF validation (tests use mocks without browser headers)
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    return true
  }

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // In development, allow requests without origin (same-origin requests)
  // Browser doesn't send Origin header for same-origin requests in some cases
  if (!origin) {
    // For same-origin requests, check referer as fallback
    const referer = request.headers.get('referer')
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const hostWithoutPort = host?.split(':')[0]
        const refererHost = refererUrl.hostname
        // Allow if referer matches host
        return refererHost === hostWithoutPort || refererHost === host
      } catch {
        return false
      }
    }
    // No origin and no referer - likely server-to-server or same-origin
    // In production, be strict; in dev, allow for testing
    return process.env.NODE_ENV === 'development'
  }

  // Build list of allowed origins
  const allowedOrigins: string[] = []

  // Add current host (handles both with and without port)
  if (host) {
    allowedOrigins.push(`https://${host}`)
    allowedOrigins.push(`http://${host}`)

    // Also allow host without port if port is specified
    const hostWithoutPort = host.split(':')[0]
    if (hostWithoutPort !== host) {
      allowedOrigins.push(`https://${hostWithoutPort}`)
      allowedOrigins.push(`http://${hostWithoutPort}`)
    }
  }

  // Add development origins
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000')
    allowedOrigins.push('http://127.0.0.1:3000')
  }

  // Add Vercel preview URLs if in production
  if (process.env.VERCEL_URL) {
    allowedOrigins.push(`https://${process.env.VERCEL_URL}`)
  }

  // Add configured production URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    allowedOrigins.push(process.env.NEXT_PUBLIC_APP_URL)
  }

  return allowedOrigins.includes(origin)
}

/**
 * Create a CSRF error response for invalid origins.
 * Use this in API routes when origin validation fails.
 *
 * @returns Object with error code and message
 */
export function createCsrfErrorResponse() {
  return {
    error: {
      code: 'INVALID_ORIGIN',
      message: 'Invalid request origin - CSRF protection triggered',
    },
  }
}

/**
 * Check if request is a state-changing method that requires CSRF protection.
 *
 * @param method - HTTP method string
 * @returns boolean - true if method requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
  return protectedMethods.includes(method.toUpperCase())
}
