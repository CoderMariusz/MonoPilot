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

    // 3. Check permission (AC-9: ADMIN or SUPER_ADMIN only)
    const roleCode = (userData.roles as any).code
    if (!['ADMIN', 'SUPER_ADMIN'].includes(roleCode)) {
      return NextResponse.json(
        { error: 'Permission denied. Only Admin and Super Admin can cancel invitations.' },
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
