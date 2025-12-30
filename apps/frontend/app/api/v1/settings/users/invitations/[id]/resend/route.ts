/**
 * POST /api/v1/settings/users/invitations/:id/resend
 * Story: 01.16 - User Invitations (Email)
 * Description: Resend invitation with new token and expiry
 * Permission: ADMIN, SUPER_ADMIN only
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { InvitationService } from '@/lib/services/invitation-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      .select('org_id, roles!inner(code)')
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
        { error: 'Permission denied. Only Admin and Owner can resend invitations.' },
        { status: 403 }
      )
    }

    // 4. Resend invitation
    const invitation = await InvitationService.resendInvitation((await params).id, userData.org_id)

    // 5. Return success response
    return NextResponse.json(
      {
        invitation_id: invitation.id,
        new_expires_at: invitation.expires_at,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('POST /api/v1/settings/users/invitations/:id/resend error:', error)

    if (error instanceof Error) {
      // Not found errors
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      // Invalid status errors
      if (error.message.includes('Can only resend')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
