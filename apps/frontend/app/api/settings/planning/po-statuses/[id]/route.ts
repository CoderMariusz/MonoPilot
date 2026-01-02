/**
 * API Routes: Single PO Status (Settings)
 * Story: 03.7 - PO Status Lifecycle (Configurable Statuses)
 *
 * GET /api/settings/planning/po-statuses/:id - Get status details
 * PUT /api/settings/planning/po-statuses/:id - Update status
 * DELETE /api/settings/planning/po-statuses/:id - Delete status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { POStatusService } from '@/lib/services/po-status-service'
import { updatePOStatusSchema } from '@/lib/validation/po-status-schemas'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/settings/planning/po-statuses/:id
 * Get details of a single PO status
 *
 * Auth: Admin only
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's org and role
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 403 }
      )
    }

    const roleData = userData.role as any
    const role = (
      typeof roleData === 'string'
        ? roleData
        : Array.isArray(roleData)
          ? roleData[0]?.code
          : roleData?.code
    )?.toLowerCase()

    const allowedRoles = ['admin', 'owner', 'super_admin', 'superadmin']
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get status
    const status = await POStatusService.getStatus(id, userData.org_id)

    if (!status) {
      return NextResponse.json(
        { error: 'Status not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error in GET /api/settings/planning/po-statuses/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/planning/po-statuses/:id
 * Update a PO status
 *
 * Body: { name?, color?, display_order?, description?, is_active? }
 *
 * Auth: Admin only
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's org and role
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 403 }
      )
    }

    const roleData = userData.role as any
    const role = (
      typeof roleData === 'string'
        ? roleData
        : Array.isArray(roleData)
          ? roleData[0]?.code
          : roleData?.code
    )?.toLowerCase()

    const allowedRoles = ['admin', 'owner', 'super_admin', 'superadmin']
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updatePOStatusSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Update status
    const result = await POStatusService.updateStatus(
      id,
      userData.org_id,
      validationResult.data
    )

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        )
      }
      if (result.code === 'SYSTEM_STATUS') {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in PUT /api/settings/planning/po-statuses/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/settings/planning/po-statuses/:id
 * Delete a PO status (if not system and not in use)
 *
 * Auth: Admin only
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's org and role
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 403 }
      )
    }

    const roleData = userData.role as any
    const role = (
      typeof roleData === 'string'
        ? roleData
        : Array.isArray(roleData)
          ? roleData[0]?.code
          : roleData?.code
    )?.toLowerCase()

    const allowedRoles = ['admin', 'owner', 'super_admin', 'superadmin']
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Check if status exists first
    const status = await POStatusService.getStatus(id, userData.org_id)
    if (!status) {
      return NextResponse.json(
        { error: 'Status not found' },
        { status: 404 }
      )
    }

    // Delete status
    const result = await POStatusService.deleteStatus(id, userData.org_id)

    if (!result.success) {
      if (result.code === 'SYSTEM_STATUS' || result.code === 'STATUS_IN_USE') {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/settings/planning/po-statuses/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
