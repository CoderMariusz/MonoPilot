/**
 * Validate Password API Route (Story 01.15)
 *
 * POST /api/v1/settings/password/validate - Real-time password validation
 *
 * Authentication: NOT REQUIRED (public endpoint for signup/password reset)
 * Coverage Target: 100%
 */

import { NextRequest, NextResponse } from 'next/server'
import { validatePassword } from '@/lib/services/password-service'
import { validatePasswordSchema } from '@/lib/validation/password'
import { ZodError } from 'zod'

/**
 * POST /api/v1/settings/password/validate
 *
 * Validate password strength and requirements in real-time
 * NO AUTHENTICATION REQUIRED (used during signup/password reset)
 *
 * Request body:
 * {
 *   password: string
 * }
 *
 * Response:
 * {
 *   valid: boolean
 *   score: number (0-4)
 *   requirements: Array<{ id, label, met }>
 *   strength_label: "Weak" | "Medium" | "Strong"
 *   strength_color: "red" | "yellow" | "green"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { password } = validatePasswordSchema.parse(body)

    // Validate password
    const result = validatePassword(password)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[API] Error in POST /api/v1/settings/password/validate:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
