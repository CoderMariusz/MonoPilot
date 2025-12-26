/**
 * DELETE /api/v1/settings/users/invitations/:id
 * Story: 01.16 - User Invitations (Email)
 * Description: Cancel/revoke invitation
 * Permission: ADMIN, SUPER_ADMIN only
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { InvitationService } from '@/lib/services/invitation-service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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
        { error: 'Permission denied. Only Admin and Owner can cancel invitations.' },
        { status: 403 }
      )
    }

    // 4. Cancel invitation
    await InvitationService.cancelInvitation(params.id, userData.org_id)

    // 5. Return success (204 No Content)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/v1/settings/users/invitations/:id error:', error)

    if (error instanceof Error) {
      // Not found errors
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      // Invalid status errors
      if (error.message.includes('Can only cancel')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
