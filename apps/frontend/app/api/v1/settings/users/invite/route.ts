/**
 * POST /api/v1/settings/users/invite
 * Story: 01.16 - User Invitations (Email)
 * Description: Send user invitation email
 * Permission: ADMIN, SUPER_ADMIN only
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { InvitationService } from '@/lib/services/invitation-service'
import { inviteUserSchema } from '@/lib/validation/invitation-schemas'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user org and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id, role_id, roles!inner(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Role can be object or array depending on Supabase query
    const roleData = userData.roles as any
    const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code

    // Check permission (AC-9: owner or admin only)
    if (!['owner', 'admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Permission denied. Only Admin and Owner can invite users.' },
        { status: 403 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validatedData = inviteUserSchema.parse(body)

    // 5. Create and send invitation
    const invitation = await InvitationService.createInvitation(
      userData.org_id,
      user.id,
      validatedData
    )

    // 6. Return success response
    return NextResponse.json(
      {
        invitation_id: invitation.id,
        email: invitation.email,
        expires_at: invitation.expires_at,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/v1/settings/users/invite error:', error)

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    // Handle known errors
    if (error instanceof Error) {
      // Duplicate email errors
      if (error.message.includes('already exists') || error.message.includes('already pending')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      // Permission errors
      if (error.message.includes('Only Super Admin')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }

      // Other known errors
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Unknown errors
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
