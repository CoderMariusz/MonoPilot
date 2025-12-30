/**
 * Reset Password API Route (Story 01.15 - Admin)
 *
 * POST /api/v1/settings/users/:id/password/reset - Admin force password reset
 *
 * Authentication: Required
 * Authorization: Admin only (owner, admin roles)
 * Coverage Target: 100%
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { forcePasswordReset } from '@/lib/services/password-service'
import { resetPasswordSchema } from '@/lib/validation/password'
import { ZodError } from 'zod'

/**
 * POST /api/v1/settings/users/:id/password/reset
 *
 * Admin force password reset for a user
 * - Sets new password
 * - Optionally sets force_password_change flag
 * - Terminates all user sessions
 *
 * Request body:
 * {
 *   new_password: string
 *   force_change: boolean (default: true)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const currentUserId = session.user.id
    const targetUserId = id

    // Get current user's role and org
    const { data: currentUser } = await supabase
      .from('users')
      .select('org_id, role_code')
      .eq('id', currentUserId)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is admin
    const isAdmin = ['owner', 'admin'].includes(currentUser.role_code)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get target user's org to verify same org
    const { data: targetUser } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', targetUserId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check same org (multi-tenancy isolation)
    if (targetUser.org_id !== currentUser.org_id) {
      // Return 404 for cross-org (not 403) per multi-tenancy pattern
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = resetPasswordSchema.parse({
      user_id: targetUserId,
      ...body,
    })

    // Force password reset
    await forcePasswordReset(
      supabase,
      targetUserId,
      currentUserId,
      validatedData.new_password,
      validatedData.force_change
    )

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error in POST /api/v1/settings/users/:id/password/reset:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    // Handle specific password reset errors
    if (error instanceof Error) {
      if (error.message === 'New password does not meet requirements') {
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
