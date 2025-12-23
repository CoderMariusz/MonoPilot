/**
 * Change Password API Route (Story 01.15)
 *
 * POST /api/v1/settings/password/change - Change user's password
 *
 * Authentication: Required
 * Coverage Target: 100%
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { changePassword } from '@/lib/services/password-service'
import { changePasswordSchema } from '@/lib/validation/password'
import { ZodError } from 'zod'

/**
 * POST /api/v1/settings/password/change
 *
 * Change user's password
 * - Verifies current password
 * - Validates new password complexity
 * - Checks password history
 * - Terminates other sessions
 *
 * Request body:
 * {
 *   current_password: string
 *   new_password: string
 *   confirm_password: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Parse and validate request body
    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // Change password
    await changePassword(
      supabase,
      userId,
      validatedData.current_password,
      validatedData.new_password
    )

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error in POST /api/v1/settings/password/change:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    // Handle specific password change errors
    if (error instanceof Error) {
      if (error.message === 'Current password is incorrect') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message === 'New password does not meet requirements') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('used recently')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
