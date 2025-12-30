/**
 * User Activation API Route
 * Story: 01.5a - User Management CRUD (MVP)
 *
 * PATCH /api/v1/settings/users/:id/activate - Activate user
 */



import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * PATCH /api/v1/settings/users/:id/activate
 * Activate user (set is_active = true)
 */
export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

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

    // Check permissions (only SUPER_ADMIN and ADMIN can activate users)
    const allowedRoles = ['owner', 'admin']
    // Role can be object or array depending on Supabase query
    const roleData = userData.role as any
    const roleCode = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code
    if (!allowedRoles.includes(roleCode || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Verify user exists in same org
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Activate user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', userData.org_id)

    if (updateError) {
      console.error('Error activating user:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User activated successfully'
    }, { status: 200 })
  } catch (error: any) {
    console.error('Unexpected error in PATCH /api/v1/settings/users/:id/activate:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
