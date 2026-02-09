/**
 * CSRF Protection Utilities
 */

import { NextRequest } from 'next/server'

/**
 * Validate CSRF token from request
 * Checks X-CSRF-Token header against token stored in cookies
 */
export function validateCSRFToken(request: NextRequest): boolean {
  // Skip validation for GET and HEAD requests
  if (request.method === 'GET' || request.method === 'HEAD') {
    return true
  }

  // Get token from header
  const headerToken = request.headers.get('x-csrf-token') || 
                     request.headers.get('X-CSRF-Token')

  // Get token from cookie
  const cookieToken = request.cookies.get('__csrf_token')?.value

  // If either is missing, fail
  if (!headerToken || !cookieToken) {
    console.warn('[CSRF] Missing token - header:', !!headerToken, 'cookie:', !!cookieToken)
    return false
  }

  // Compare tokens
  const isValid = headerToken === cookieToken

  if (!isValid) {
    console.warn('[CSRF] Token mismatch')
  }

  return isValid
}

/**
 * Extract CSRF token from request
 */
export function getCSRFToken(request: NextRequest): string | null {
  return request.headers.get('x-csrf-token') || 
         request.headers.get('X-CSRF-Token') ||
         request.cookies.get('__csrf_token')?.value ||
         null
}
