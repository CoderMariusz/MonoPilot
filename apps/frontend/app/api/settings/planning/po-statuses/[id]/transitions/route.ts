/**
 * API Routes: PO Status Transitions (Settings)
 * Story: 03.7 - PO Status Lifecycle (Configurable Statuses)
 *
 * GET /api/settings/planning/po-statuses/:id/transitions - Get allowed transitions
 * PUT /api/settings/planning/po-statuses/:id/transitions - Update transitions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { POStatusService } from '@/lib/services/po-status-service'
import { updateStatusTransitionsSchema } from '@/lib/validation/po-status-schemas'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/settings/planning/po-statuses/:id/transitions
 * Get allowed transitions from a status
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

    // Check if status exists
    const status = await POStatusService.getStatus(id, userData.org_id)
    if (!status) {
      return NextResponse.json(
        { error: 'Status not found' },
        { status: 404 }
      )
    }

    // Get transitions
    const transitions = await POStatusService.getStatusTransitions(id, userData.org_id)

    return NextResponse.json({
      transitions,
      total: transitions.length,
    })
  } catch (error) {
    console.error('Error in GET /api/settings/planning/po-statuses/:id/transitions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/planning/po-statuses/:id/transitions
 * Update allowed transitions from a status
 *
 * Body: { allowed_to_status_ids: string[] }
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

    // Check if status exists
    const status = await POStatusService.getStatus(id, userData.org_id)
    if (!status) {
      return NextResponse.json(
        { error: 'Status not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateStatusTransitionsSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Update transitions
    const result = await POStatusService.updateStatusTransitions(
      id,
      userData.org_id,
      validationResult.data.allowed_to_status_ids
    )

    if (!result.success) {
      if (result.code === 'SELF_LOOP' || result.code === 'SYSTEM_TRANSITION') {
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

    return NextResponse.json({
      transitions: result.data,
      total: result.data?.length || 0,
    })
  } catch (error) {
    console.error('Error in PUT /api/settings/planning/po-statuses/:id/transitions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
