/**
 * API Route: Record Material Consumption
 * Story 04.6a: Material Consumption Desktop
 *
 * POST /api/production/work-orders/:woId/consume
 * Records direct material consumption from LP (no reservation required)
 *
 * Security:
 * - Requires authentication
 * - Role-based: owner, admin, production_manager, production_operator
 * - RLS: org_id isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { consumeRequestSchema } from '@/lib/validation/consumption-schemas'

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  WO_NOT_FOUND: 'WO_NOT_FOUND',
  WO_NOT_IN_PROGRESS: 'WO_NOT_IN_PROGRESS',
  MATERIAL_NOT_FOUND: 'MATERIAL_NOT_FOUND',
  LP_NOT_FOUND: 'LP_NOT_FOUND',
  LP_NOT_AVAILABLE: 'LP_NOT_AVAILABLE',
  LP_QA_HOLD: 'LP_QA_HOLD',
  LP_EXPIRED: 'LP_EXPIRED',
  PRODUCT_MISMATCH: 'PRODUCT_MISMATCH',
  UOM_MISMATCH: 'UOM_MISMATCH',
  INSUFFICIENT_QUANTITY: 'INSUFFICIENT_QUANTITY',
  FULL_LP_REQUIRED: 'FULL_LP_REQUIRED',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
} as const

// Roles allowed to consume materials
const ALLOWED_ROLES = ['owner', 'admin', 'production_manager', 'production_operator']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ woId: string }> }
) {
  try {
    const { woId } = await params
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

    // 3. Role-based authorization
    const roleCode = (currentUser.role as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (!ALLOWED_ROLES.includes(roleCode)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: ERROR_CODES.FORBIDDEN },
        { status: 403 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validation = consumeRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { wo_material_id, lp_id, consume_qty, notes } = validation.data
    const supabaseAdmin = createServerSupabaseAdmin()

    // 5. Verify work order exists and is in valid status
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

    // Only allow consumption when WO is in_progress or released
    const validStatuses = ['in_progress', 'released']
    if (!validStatuses.includes(workOrder.status)) {
      return NextResponse.json(
        {
          error: `Cannot consume materials when work order is ${workOrder.status}`,
          code: ERROR_CODES.WO_NOT_IN_PROGRESS,
        },
        { status: 400 }
      )
    }

    // 6. Get WO material
    const { data: material, error: matError } = await supabaseAdmin
      .from('wo_materials')
      .select('id, wo_id, product_id, material_name, required_qty, consumed_qty, uom, consume_whole_lp')
      .eq('id', wo_material_id)
      .eq('wo_id', woId)
      .single()

    if (matError || !material) {
      return NextResponse.json(
        { error: 'Material not found', code: ERROR_CODES.MATERIAL_NOT_FOUND },
        { status: 404 }
      )
    }

    // 7. Get LP and validate
    const { data: lp, error: lpError } = await supabaseAdmin
      .from('license_plates')
      .select('id, lp_number, product_id, quantity, current_qty, uom, status, qa_status, batch_number, expiry_date')
      .eq('id', lp_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (lpError || !lp) {
      return NextResponse.json(
        { error: 'License plate not found', code: ERROR_CODES.LP_NOT_FOUND },
        { status: 400 }
      )
    }

    // 8. LP status validation
    if (lp.status !== 'available' && lp.status !== 'reserved') {
      return NextResponse.json(
        {
          error: `LP is not available (status: ${lp.status})`,
          code: ERROR_CODES.LP_NOT_AVAILABLE,
        },
        { status: 400 }
      )
    }

    // 9. QA status validation
    if (lp.qa_status === 'on_hold' || lp.qa_status === 'rejected') {
      return NextResponse.json(
        {
          error: `LP is on QA hold (status: ${lp.qa_status})`,
          code: ERROR_CODES.LP_QA_HOLD,
        },
        { status: 400 }
      )
    }

    // 10. Expiry validation
    if (lp.expiry_date) {
      const today = new Date().toISOString().split('T')[0]
      if (lp.expiry_date < today) {
        return NextResponse.json(
          { error: 'LP is expired', code: ERROR_CODES.LP_EXPIRED },
          { status: 400 }
        )
      }
    }

    // 11. Product match validation
    if (lp.product_id !== material.product_id) {
      return NextResponse.json(
        {
          error: 'Product mismatch: LP contains different product than required',
          code: ERROR_CODES.PRODUCT_MISMATCH,
        },
        { status: 400 }
      )
    }

    // 12. UoM match validation
    if (lp.uom !== material.uom) {
      return NextResponse.json(
        {
          error: `UoM mismatch: LP is ${lp.uom}, material requires ${material.uom}`,
          code: ERROR_CODES.UOM_MISMATCH,
        },
        { status: 400 }
      )
    }

    // 13. Quantity validations
    const lpQty = Number(lp.current_qty ?? lp.quantity)

    if (consume_qty <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be positive', code: ERROR_CODES.INVALID_QUANTITY },
        { status: 400 }
      )
    }

    if (consume_qty > lpQty) {
      return NextResponse.json(
        {
          error: `Insufficient quantity: LP has ${lpQty}, requested ${consume_qty}`,
          code: ERROR_CODES.INSUFFICIENT_QUANTITY,
        },
        { status: 400 }
      )
    }

    // 14. Full LP consumption check
    if (material.consume_whole_lp && Math.abs(consume_qty - lpQty) > 0.0001) {
      return NextResponse.json(
        {
          error: `Full LP consumption required. LP quantity is ${lpQty}`,
          code: ERROR_CODES.FULL_LP_REQUIRED,
        },
        { status: 400 }
      )
    }

    // 15. Create consumption record
    const isFullLp = Math.abs(consume_qty - lpQty) < 0.0001
    const newLpQty = lpQty - consume_qty

    const { data: consumption, error: consumeError } = await supabaseAdmin
      .from('wo_material_consumptions')
      .insert({
        org_id: currentUser.org_id,
        wo_id: woId,
        wo_material_id: wo_material_id,
        lp_id: lp_id,
        product_id: material.product_id,
        consumed_qty: consume_qty,
        uom: material.uom,
        is_full_lp: isFullLp,
        lp_batch_number: lp.batch_number,
        lp_expiry_date: lp.expiry_date,
        consumed_by: user.id,
        consumed_at: new Date().toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (consumeError) {
      console.error('Error creating consumption:', consumeError)
      return NextResponse.json(
        { error: 'Failed to record consumption' },
        { status: 500 }
      )
    }

    // 16. Update LP quantity and status
    const lpUpdateData: Record<string, unknown> = {
      current_qty: newLpQty,
      updated_at: new Date().toISOString(),
    }

    if (newLpQty <= 0) {
      lpUpdateData.status = 'consumed'
      lpUpdateData.consumed_by_wo_id = woId
      lpUpdateData.consumed_at = new Date().toISOString()
    }

    await supabaseAdmin
      .from('license_plates')
      .update(lpUpdateData)
      .eq('id', lp_id)

    // 17. Update wo_materials consumed_qty
    const currentConsumed = Number(material.consumed_qty || 0)
    await supabaseAdmin
      .from('wo_materials')
      .update({
        consumed_qty: currentConsumed + consume_qty,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wo_material_id)

    // 18. Create LP movement record
    await supabaseAdmin.from('lp_movements').insert({
      org_id: currentUser.org_id,
      lp_id: lp_id,
      movement_type: 'consumption',
      qty_change: -consume_qty,
      qty_before: lpQty,
      qty_after: newLpQty,
      uom: material.uom,
      wo_id: woId,
      consumption_id: consumption.id,
      created_by_user_id: user.id,
      notes: notes || `Material consumption for WO ${workOrder.wo_number}`,
    })

    // 19. Return success response
    return NextResponse.json(
      {
        consumption: {
          id: consumption.id,
          consumed_qty: consume_qty,
          consumed_at: consumption.consumed_at,
        },
        lp_updated: {
          id: lp_id,
          new_qty: newLpQty,
          new_status: newLpQty <= 0 ? 'consumed' : 'available',
        },
        material_progress: {
          consumed: currentConsumed + consume_qty,
          required: material.required_qty,
          percentage: Math.round(((currentConsumed + consume_qty) / material.required_qty) * 100),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/production/work-orders/:woId/consume:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
