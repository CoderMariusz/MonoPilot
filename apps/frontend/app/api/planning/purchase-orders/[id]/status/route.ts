/**
 * API Route: Purchase Order Status Change
 * Story: 03.7 - PO Status Lifecycle (Configurable Statuses)
 *
 * POST /api/planning/purchase-orders/:id/status - Change PO status (Story 03.7)
 * PUT /api/planning/purchase-orders/:id/status - Change PO status (Legacy)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { POStatusService } from '@/lib/services/po-status-service'
import { transitionStatusSchema } from '@/lib/validation/po-status-schemas'
import { z } from 'zod'

// Legacy schema for backward compatibility
const statusChangeSchema = z.object({
  status: z.string().min(1, 'Status is required'),
})

type StatusChangeInput = z.infer<typeof statusChangeSchema>

/**
 * POST /api/planning/purchase-orders/:id/status
 * Change the status of a PO using the new transition system (Story 03.7)
 *
 * Body: { to_status: string, notes?: string }
 *
 * Auth: Planner or Admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Planner and above can change status
    const allowedRoles = ['admin', 'owner', 'super_admin', 'superadmin', 'planner', 'production_manager']
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - Planner access required' },
        { status: 403 }
      )
    }

    // Check if PO exists
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('id')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (!po) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = transitionStatusSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Execute transition using the new service
    const result = await POStatusService.transitionStatus(
      id,
      validationResult.data.to_status,
      user.id,
      userData.org_id,
      validationResult.data.notes || undefined
    )

    if (!result.success) {
      if (result.code === 'INVALID_TRANSITION' || result.code === 'NO_LINES') {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/:id/status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/planning/purchase-orders/:id/status - Change PO status (Legacy)
 * Kept for backward compatibility
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData: StatusChangeInput = statusChangeSchema.parse(body)

    const supabaseAdmin = createServerSupabaseAdmin()

    // AC-5.7: Get PO to verify status and approval state
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, org_id, status, approval_status')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (poError || !po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // AC-5.7: Cannot change status if PO is closed
    if (po.status.toLowerCase() === 'closed') {
      return NextResponse.json(
        { error: 'Cannot change status of a closed PO' },
        { status: 403 }
      )
    }

    // AC-5.7: Cannot change status if approval is pending
    if (po.approval_status === 'pending') {
      return NextResponse.json(
        { error: 'Cannot change status while approval is pending' },
        { status: 403 }
      )
    }

    // Get planning settings to verify status exists
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('planning_settings')
      .select('po_statuses')
      .eq('org_id', currentUser.org_id)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Planning settings not found' }, { status: 500 })
    }

    // AC-5.7: Verify status exists in po_statuses
    const statuses = settings.po_statuses as Array<{ code: string }>
    const statusExists = statuses.some(s => s.code === validatedData.status)

    if (!statusExists) {
      return NextResponse.json(
        { error: `Status "${validatedData.status}" does not exist` },
        { status: 400 }
      )
    }

    // Update PO status
    const { data, error: updateError } = await supabaseAdmin
      .from('purchase_orders')
      .update({
        status: validatedData.status,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating PO status:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log status change in activity_logs
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        org_id: currentUser.org_id,
        user_id: session.user.id,
        action: 'status_changed',
        entity_type: 'purchase_order',
        entity_id: id,
        details: {
          old_status: po.status,
          new_status: validatedData.status,
        },
      })

    return NextResponse.json({
      purchase_order: data,
      message: 'PO status updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/planning/purchase-orders/:id/status:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
