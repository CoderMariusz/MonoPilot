/**
 * API Route: Consume Material from Reservation
 * Story 4.9: 1:1 Consumption Enforcement
 * Story 4.18: LP Updates After Consumption
 *
 * POST /api/production/work-orders/:id/consume - Consume material
 * GET /api/production/work-orders/:id/consume - List consumptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

const consumeSchema = z.object({
  reservation_id: z.string().uuid('Invalid reservation ID'),
  qty: z.number().positive('Quantity must be positive'),
  operation_id: z.string().uuid().optional(),
  notes: z.string().optional(),
})

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  WO_NOT_FOUND: 'WO_NOT_FOUND',
  RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
  RESERVATION_ALREADY_CONSUMED: 'RESERVATION_ALREADY_CONSUMED',
  INVALID_WO_STATUS: 'INVALID_WO_STATUS',
  CONSUME_WHOLE_LP_REQUIRED: 'CONSUME_WHOLE_LP_REQUIRED',
  QTY_EXCEEDS_RESERVED: 'QTY_EXCEEDS_RESERVED',
  MATERIAL_NOT_FOUND: 'MATERIAL_NOT_FOUND',
  INSUFFICIENT_LP_QTY: 'INSUFFICIENT_LP_QTY',
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
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = consumeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { reservation_id, qty, operation_id, notes } = validation.data
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get work order and verify status
    const { data: workOrder, error: woError } = await supabaseAdmin
      .from('work_orders')
      .select('id, wo_number, status, org_id')
      .eq('id', woId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (woError || !workOrder) {
      return NextResponse.json(
        { error: 'Work order not found', code: ERROR_CODES.WO_NOT_FOUND },
        { status: 404 }
      )
    }

    if (workOrder.status !== 'in_progress') {
      return NextResponse.json(
        {
          error: `Cannot consume materials for work order in '${workOrder.status}' status`,
          code: ERROR_CODES.INVALID_WO_STATUS
        },
        { status: 400 }
      )
    }

    // Get reservation with material and LP details
    const { data: reservation, error: resError } = await supabaseAdmin
      .from('wo_material_reservations')
      .select(`
        id, wo_id, material_id, lp_id, reserved_qty, uom, status,
        wo_materials!inner(id, material_name, consume_whole_lp, required_qty, consumed_qty),
        license_plates!inner(id, lp_number, current_qty, status)
      `)
      .eq('id', reservation_id)
      .eq('wo_id', woId)
      .single()

    if (resError || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found', code: ERROR_CODES.RESERVATION_NOT_FOUND },
        { status: 404 }
      )
    }

    if (reservation.status === 'consumed') {
      return NextResponse.json(
        { error: 'This reservation has already been consumed', code: ERROR_CODES.RESERVATION_ALREADY_CONSUMED },
        { status: 400 }
      )
    }

    // Handle Supabase join results
    type MaterialType = { material_name: string; consume_whole_lp: boolean; consumed_qty: number | null }
    type LpType = { id: string; lp_number: string; current_qty: number }
    const material = Array.isArray(reservation.wo_materials)
      ? (reservation.wo_materials as MaterialType[])[0]
      : reservation.wo_materials as MaterialType
    const lp = Array.isArray(reservation.license_plates)
      ? (reservation.license_plates as LpType[])[0]
      : reservation.license_plates as LpType

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found', code: ERROR_CODES.MATERIAL_NOT_FOUND },
        { status: 404 }
      )
    }

    // AC-4.9.1, AC-4.9.5: Enforce consume_whole_lp
    if (material.consume_whole_lp === true) {
      const reservedQty = Number(reservation.reserved_qty)
      if (Math.abs(qty - reservedQty) > 0.0001) {
        return NextResponse.json(
          {
            error: `Material '${material.material_name}' must be consumed entirely (${reservedQty} ${reservation.uom}). Cannot consume partial amounts.`,
            code: ERROR_CODES.CONSUME_WHOLE_LP_REQUIRED,
            required_qty: reservedQty,
            requested_qty: qty,
          },
          { status: 400 }
        )
      }
    }

    if (qty > Number(reservation.reserved_qty)) {
      return NextResponse.json(
        {
          error: `Cannot consume ${qty} ${reservation.uom}. Only ${reservation.reserved_qty} ${reservation.uom} is reserved.`,
          code: ERROR_CODES.QTY_EXCEEDS_RESERVED
        },
        { status: 400 }
      )
    }

    // AC-4.18.7: Validate LP has enough qty
    const lpCurrentQty = Number(lp?.current_qty || 0)
    if (qty > lpCurrentQty) {
      return NextResponse.json(
        {
          error: `LP has ${lpCurrentQty} ${reservation.uom} available, requested ${qty}`,
          code: ERROR_CODES.INSUFFICIENT_LP_QTY
        },
        { status: 400 }
      )
    }

    // Create consumption record
    const { data: consumption, error: consumeError } = await supabaseAdmin
      .from('wo_consumption')
      .insert({
        org_id: currentUser.org_id,
        wo_id: woId,
        material_id: reservation.material_id,
        reservation_id: reservation_id,
        lp_id: reservation.lp_id,
        consumed_qty: qty,
        uom: reservation.uom,
        consumed_by_user_id: session.user.id,
        operation_id: operation_id || null,
        notes: notes || null,
        status: 'consumed',
      })
      .select()
      .single()

    if (consumeError) {
      console.error('Error creating consumption:', consumeError)
      return NextResponse.json({ error: 'Failed to record consumption' }, { status: 500 })
    }

    // Update reservation status to consumed
    await supabaseAdmin
      .from('wo_material_reservations')
      .update({ status: 'consumed' })
      .eq('id', reservation_id)

    // Update wo_materials consumed_qty
    const currentConsumed = Number(material.consumed_qty || 0)
    await supabaseAdmin
      .from('wo_materials')
      .update({
        consumed_qty: currentConsumed + qty,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservation.material_id)

    // AC-4.18.1, AC-4.18.2: Update LP qty and status
    const newLpQty = lpCurrentQty - qty
    const lpUpdateData: Record<string, unknown> = {
      current_qty: newLpQty,
      updated_at: new Date().toISOString()
    }

    // AC-4.18.2: Mark as consumed if qty = 0
    if (newLpQty <= 0) {
      lpUpdateData.status = 'consumed'
      lpUpdateData.consumed_by_wo_id = woId
      lpUpdateData.consumed_at = new Date().toISOString()
    }

    await supabaseAdmin
      .from('license_plates')
      .update(lpUpdateData)
      .eq('id', reservation.lp_id)

    // AC-4.18.6: Create LP movement record
    await supabaseAdmin
      .from('lp_movements')
      .insert({
        org_id: currentUser.org_id,
        lp_id: reservation.lp_id,
        movement_type: 'consumption',
        qty_change: -qty,
        qty_before: lpCurrentQty,
        qty_after: newLpQty,
        uom: reservation.uom,
        wo_id: woId,
        consumption_id: consumption.id,
        created_by_user_id: session.user.id,
        notes: `Material consumption for WO ${workOrder.wo_number}`,
      })

    return NextResponse.json({
      consumption,
      message: `Successfully consumed ${qty} ${reservation.uom} of ${material.material_name}`,
      material_name: material.material_name,
      lp_number: lp?.lp_number,
      consumed_qty: qty,
      uom: reservation.uom,
      lp_remaining_qty: newLpQty,
    })
  } catch (error) {
    console.error('Error in POST /api/production/work-orders/:id/consume:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    const { data: consumptions, error } = await supabaseAdmin
      .from('wo_consumption')
      .select(`
        id, wo_id, material_id, reservation_id, lp_id, consumed_qty, uom,
        consumed_at, consumed_by_user_id, operation_id, notes, status,
        reversed_at, reverse_reason,
        wo_materials(material_name, product_id),
        license_plates(lp_number),
        users(first_name, last_name, email)
      `)
      .eq('wo_id', woId)
      .eq('org_id', currentUser.org_id)
      .order('consumed_at', { ascending: true })

    if (error) {
      console.error('Error fetching consumptions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ consumptions: consumptions || [] })
  } catch (error) {
    console.error('Error in GET /api/production/work-orders/:id/consume:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
