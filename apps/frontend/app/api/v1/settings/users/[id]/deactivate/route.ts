/**
 * User Deactivation API Route
 * Story: 01.5a - User Management CRUD (MVP)
 *
 * PATCH /api/v1/settings/users/:id/deactivate - Deactivate user
 */



import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

interface RouteContext {
  params: {
    id: string
  }
}

/**
 * PATCH /api/v1/settings/users/:id/deactivate
 * Deactivate user (set is_active = false)
 *
 * Self-protection logic:
 * - Cannot deactivate self
 * - Cannot deactivate last Super Admin
 */
export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const supabase = await createServerSupabase()
    const { id } = params

    // Get current user for org context
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id and role
    const { data: userData } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', authUser.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions (only SUPER_ADMIN and ADMIN can deactivate users)
    const allowedRoles = ['owner', 'admin']
    // Role can be object or array depending on Supabase query
    const roleData = userData.role as any
    const roleCode = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code
    if (!allowedRoles.includes(roleCode || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Self-protection check 1: Cannot deactivate self
    if (id === authUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get target user to check role
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, org_id, role:roles(id, code), is_active')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Self-protection check 2: Cannot deactivate last Super Admin
    if ((targetUser.role as any)?.[0]?.code === 'owner') {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', userData.org_id)
        .eq('role.code', 'owner')
        .eq('is_active', true)

      if (count === 1) {
        return NextResponse.json(
          { error: 'Cannot deactivate the only Super Admin' },
          { status: 400 }
        )
      }
    }

    // Deactivate user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', userData.org_id)

    if (updateError) {
      console.error('Error deactivating user:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    }, { status: 200 })
  } catch (error: any) {
    console.error('Unexpected error in PATCH /api/v1/settings/users/:id/deactivate:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
