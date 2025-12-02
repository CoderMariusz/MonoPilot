/**
 * API Route: Reverse Consumption
 * Story 4.10: Consumption Correction
 *
 * POST /api/production/work-orders/:id/consume/reverse
 * Reverses a consumption record (Manager/Admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

const reverseSchema = z.object({
  consumption_id: z.string().uuid('Invalid consumption ID'),
  reason: z.string().min(1, 'Reason is required').max(500),
})

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  WO_NOT_FOUND: 'WO_NOT_FOUND',
  CONSUMPTION_NOT_FOUND: 'CONSUMPTION_NOT_FOUND',
  ALREADY_REVERSED: 'ALREADY_REVERSED',
} as const

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // AC-4.10.4: Role-based access - Manager and Admin only
    const allowedRoles = ['admin', 'manager']
    if (!allowedRoles.includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        {
          error: 'Forbidden: Only Manager or Admin can reverse consumption',
          code: ERROR_CODES.FORBIDDEN,
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = reverseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { consumption_id, reason } = validation.data
    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify WO exists
    const { data: workOrder, error: woError } = await supabaseAdmin
      .from('work_orders')
      .select('id, wo_number, org_id')
      .eq('id', woId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (woError || !workOrder) {
      return NextResponse.json(
        { error: 'Work order not found', code: ERROR_CODES.WO_NOT_FOUND },
        { status: 404 }
      )
    }

    // Get consumption record
    const { data: consumption, error: consumeError } = await supabaseAdmin
      .from('wo_consumption')
      .select(`
        id, wo_id, material_id, reservation_id, lp_id, consumed_qty, uom, status,
        wo_materials(material_name),
        license_plates(id, lp_number, current_qty, status)
      `)
      .eq('id', consumption_id)
      .eq('wo_id', woId)
      .single()

    if (consumeError || !consumption) {
      return NextResponse.json(
        { error: 'Consumption record not found', code: ERROR_CODES.CONSUMPTION_NOT_FOUND },
        { status: 404 }
      )
    }

    if (consumption.status === 'reversed') {
      return NextResponse.json(
        { error: 'This consumption has already been reversed', code: ERROR_CODES.ALREADY_REVERSED },
        { status: 400 }
      )
    }

    // Handle Supabase join results
    type MaterialType = { material_name: string }
    type LpType = { id: string; lp_number: string; current_qty: number }
    const material = Array.isArray(consumption.wo_materials)
      ? (consumption.wo_materials as MaterialType[])[0]
      : consumption.wo_materials as MaterialType
    const lp = Array.isArray(consumption.license_plates)
      ? (consumption.license_plates as LpType[])[0]
      : consumption.license_plates as LpType

    // Mark consumption as reversed
    await supabaseAdmin
      .from('wo_consumption')
      .update({
        status: 'reversed',
        reversed_at: new Date().toISOString(),
        reversed_by_user_id: session.user.id,
        reverse_reason: reason,
      })
      .eq('id', consumption_id)

    // Update reservation status back to reserved
    await supabaseAdmin
      .from('wo_material_reservations')
      .update({ status: 'reserved' })
      .eq('id', consumption.reservation_id)

    // Restore LP qty and status
    const lpCurrentQty = Number(lp?.current_qty || 0)
    const restoredQty = lpCurrentQty + Number(consumption.consumed_qty)
    await supabaseAdmin
      .from('license_plates')
      .update({
        current_qty: restoredQty,
        status: 'reserved',
        consumed_by_wo_id: null,
        consumed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consumption.lp_id)

    // Update wo_materials consumed_qty
    const { data: currentMaterial } = await supabaseAdmin
      .from('wo_materials')
      .select('consumed_qty')
      .eq('id', consumption.material_id)
      .single()

    if (currentMaterial) {
      const newConsumed = Math.max(0, Number(currentMaterial.consumed_qty || 0) - Number(consumption.consumed_qty))
      await supabaseAdmin
        .from('wo_materials')
        .update({
          consumed_qty: newConsumed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', consumption.material_id)
    }

    // Create reversal movement record
    await supabaseAdmin
      .from('lp_movements')
      .insert({
        org_id: currentUser.org_id,
        lp_id: consumption.lp_id,
        movement_type: 'reversal',
        qty_change: Number(consumption.consumed_qty),
        qty_before: lpCurrentQty,
        qty_after: restoredQty,
        uom: consumption.uom,
        wo_id: woId,
        consumption_id: consumption_id,
        created_by_user_id: session.user.id,
        notes: `Consumption reversal for WO ${workOrder.wo_number}. Reason: ${reason}`,
      })

    // AC-4.19.5: Mark genealogy records as reversed (compliance - never delete)
    await supabaseAdmin
      .from('lp_genealogy')
      .update({
        status: 'reversed',
        reversed_at: new Date().toISOString(),
        reversed_by: session.user.id,
        reverse_reason: reason,
      })
      .eq('parent_lp_id', consumption.lp_id)
      .eq('work_order_id', woId)
      .eq('wo_material_reservation_id', consumption.reservation_id)

    // Create audit log
    try {
      await supabaseAdmin.from('activity_logs').insert({
        org_id: currentUser.org_id,
        user_id: session.user.id,
        action: 'consume_reverse',
        entity_type: 'wo_consumption',
        entity_id: consumption_id,
        entity_code: workOrder.wo_number,
        description: `Reversed consumption of ${consumption.consumed_qty} ${consumption.uom} of ${material?.material_name || 'material'}. Reason: ${reason}`,
      })
    } catch (logError) {
      console.error('Error creating audit log:', logError)
    }

    return NextResponse.json({
      message: 'Consumption reversed successfully',
      consumption_id,
      reversed_qty: consumption.consumed_qty,
      uom: consumption.uom,
      material_name: material?.material_name,
      lp_number: lp?.lp_number,
    })
  } catch (error) {
    console.error('Error in POST /api/production/work-orders/:id/consume/reverse:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
