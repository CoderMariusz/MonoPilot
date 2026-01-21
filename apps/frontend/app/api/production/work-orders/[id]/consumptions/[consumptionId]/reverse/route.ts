/**
 * API Route: Reverse Consumption
 * Story 04.6a: Material Consumption Desktop
 *
 * POST /api/production/work-orders/:id/consumptions/:consumptionId/reverse
 * Reverses a consumption record (Manager only)
 *
 * Security:
 * - Requires authentication
 * - Role-based: owner, admin, production_manager only
 * - RLS: org_id isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

const reverseSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
  notes: z.string().max(1000).optional(),
})

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  WO_NOT_FOUND: 'WO_NOT_FOUND',
  CONSUMPTION_NOT_FOUND: 'CONSUMPTION_NOT_FOUND',
  ALREADY_REVERSED: 'ALREADY_REVERSED',
} as const

// Only managers can reverse consumptions
const ALLOWED_ROLES = ['owner', 'admin', 'production_manager']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; consumptionId: string }> }
) {
  try {
    const { id: woId, consumptionId } = await params
    const supabase = await createServerSupabase()

    // 1. Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // 2. Get current user with role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // 3. Role-based authorization - Manager only
    const roleCode = (currentUser.role as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (!ALLOWED_ROLES.includes(roleCode)) {
      return NextResponse.json(
        { error: 'Only managers can reverse consumptions', code: ERROR_CODES.FORBIDDEN },
        { status: 403 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validation = reverseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { reason, notes } = validation.data
    const supabaseAdmin = createServerSupabaseAdmin()

    // 5. Verify work order exists
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

    // 6. Get consumption record
    const { data: consumption, error: consumeError } = await supabaseAdmin
      .from('wo_material_consumptions')
      .select(`
        id, wo_id, wo_material_id, lp_id, product_id,
        consumed_qty, uom, is_full_lp, status,
        wo_materials(material_name),
        license_plates(id, lp_number, current_qty, status)
      `)
      .eq('id', consumptionId)
      .eq('wo_id', woId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (consumeError || !consumption) {
      return NextResponse.json(
        { error: 'Consumption not found', code: ERROR_CODES.CONSUMPTION_NOT_FOUND },
        { status: 404 }
      )
    }

    if (consumption.status === 'reversed') {
      return NextResponse.json(
        { error: 'Consumption already reversed', code: ERROR_CODES.ALREADY_REVERSED },
        { status: 400 }
      )
    }

    // 7. Handle Supabase join results
    type MaterialType = { material_name: string }
    type LpType = { id: string; lp_number: string; current_qty: number; status: string }
    const material = Array.isArray(consumption.wo_materials)
      ? (consumption.wo_materials as MaterialType[])[0]
      : consumption.wo_materials as MaterialType
    const lp = Array.isArray(consumption.license_plates)
      ? (consumption.license_plates as LpType[])[0]
      : consumption.license_plates as LpType

    // 8. Mark consumption as reversed
    const { error: updateError } = await supabaseAdmin
      .from('wo_material_consumptions')
      .update({
        status: 'reversed',
        reversed_at: new Date().toISOString(),
        reversed_by: user.id,
        reversal_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consumptionId)

    if (updateError) {
      console.error('Error updating consumption:', updateError)
      return NextResponse.json(
        { error: 'Failed to reverse consumption' },
        { status: 500 }
      )
    }

    // 9. Restore LP quantity and status
    const lpCurrentQty = Number(lp?.current_qty || 0)
    const restoredQty = lpCurrentQty + Number(consumption.consumed_qty)

    await supabaseAdmin
      .from('license_plates')
      .update({
        current_qty: restoredQty,
        status: 'available',
        consumed_by_wo_id: null,
        consumed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consumption.lp_id)

    // 10. Update wo_materials consumed_qty
    const { data: currentMaterial } = await supabaseAdmin
      .from('wo_materials')
      .select('consumed_qty')
      .eq('id', consumption.wo_material_id)
      .single()

    if (currentMaterial) {
      const newConsumed = Math.max(
        0,
        Number(currentMaterial.consumed_qty || 0) - Number(consumption.consumed_qty)
      )
      await supabaseAdmin
        .from('wo_materials')
        .update({
          consumed_qty: newConsumed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', consumption.wo_material_id)
    }

    // 11. Create reversal movement record
    await supabaseAdmin.from('lp_movements').insert({
      org_id: currentUser.org_id,
      lp_id: consumption.lp_id,
      movement_type: 'reversal',
      qty_change: Number(consumption.consumed_qty),
      qty_before: lpCurrentQty,
      qty_after: restoredQty,
      uom: consumption.uom,
      wo_id: woId,
      consumption_id: consumptionId,
      created_by_user_id: user.id,
      notes: notes || `Consumption reversal for WO ${workOrder.wo_number}. Reason: ${reason}`,
    })

    // 12. Return success response
    return NextResponse.json({
      success: true,
      lp_restored: {
        id: consumption.lp_id,
        new_qty: restoredQty,
        new_status: 'available',
      },
      consumption: {
        id: consumptionId,
        status: 'reversed',
        reversed_at: new Date().toISOString(),
        reversed_by: user.id,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/production/work-orders/:id/consumptions/:consumptionId/reverse:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
