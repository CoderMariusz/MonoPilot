/**
 * API Route: CSRF Token Generation
 * GET /api/csrf-token - Generates and returns a CSRF token
 */

import { NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Generate a CSRF token
 * In production, this should be stored in the session/database
 * For now, using a signed token approach
 */
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function GET() {
  try {
    const token = generateCSRFToken()

    const response = NextResponse.json(
      { token },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-CSRF-Token': token,
        },
      }
    )

    // Store token in secure, httpOnly cookie
    response.cookies.set('__csrf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    })

    return response
  } catch (error) {
    console.error('[CSRF Token] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
