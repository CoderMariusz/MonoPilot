// API Route: Purchase Order Status Change
// Epic 3 Batch 3A - Story 3.5: Configurable PO Statuses
// PUT /api/planning/purchase-orders/:id/status - Change PO status

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

const statusChangeSchema = z.object({
  status: z.string().min(1, 'Status is required'),
})

type StatusChangeInput = z.infer<typeof statusChangeSchema>

// PUT /api/planning/purchase-orders/:id/status - Change PO status
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
      .select('role, org_id')
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
