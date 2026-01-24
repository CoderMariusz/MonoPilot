/**
 * API Route: Request Over-Consumption Approval
 * Story 04.6e: Over-Consumption Control
 *
 * POST /api/production/work-orders/:id/over-consumption/request
 * Creates an over-consumption approval request when consumption exceeds BOM
 *
 * Security:
 * - Requires authentication
 * - Role-based: owner, admin, production_manager, production_operator
 * - RLS: org_id isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { overConsumptionRequestSchema } from '@/lib/validation/production-schemas'

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  WO_NOT_FOUND: 'WO_NOT_FOUND',
  NOT_OVER_CONSUMPTION: 'NOT_OVER_CONSUMPTION',
  OVER_CONSUMPTION_ALLOWED: 'OVER_CONSUMPTION_ALLOWED',
  PENDING_REQUEST_EXISTS: 'PENDING_REQUEST_EXISTS',
} as const

// Roles allowed to request over-consumption approval
const ALLOWED_ROLES = ['owner', 'admin', 'production_manager', 'production_operator']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
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

    // 2. Get current user with role and org
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, org_id, full_name, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // 3. Role-based authorization
    const roleCode = (currentUser.role as unknown as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (!ALLOWED_ROLES.includes(roleCode)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: ERROR_CODES.FORBIDDEN },
        { status: 403 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validation = overConsumptionRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { wo_material_id, lp_id, requested_qty } = validation.data

    // 5. Verify work order exists
    const { data: workOrder, error: woError } = await supabase
      .from('work_orders')
      .select('id, wo_number')
      .eq('id', woId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (woError || !workOrder) {
      return NextResponse.json(
        { error: 'Work order not found', code: ERROR_CODES.WO_NOT_FOUND },
        { status: 404 }
      )
    }

    // 6. Check production settings
    const { data: settings } = await supabase
      .from('production_settings')
      .select('allow_over_consumption')
      .eq('org_id', currentUser.org_id)
      .single()

    // If over-consumption is allowed, no need for approval
    if (settings?.allow_over_consumption) {
      return NextResponse.json(
        {
          error: 'Over-consumption is allowed by settings',
          code: ERROR_CODES.OVER_CONSUMPTION_ALLOWED,
        },
        { status: 400 }
      )
    }

    // 7. Get wo_material data
    const { data: material, error: matError } = await supabase
      .from('wo_materials')
      .select('id, required_qty, consumed_qty, material_name, product_id')
      .eq('id', wo_material_id)
      .single()

    if (matError || !material) {
      return NextResponse.json(
        { error: 'Material not found', code: ERROR_CODES.WO_NOT_FOUND },
        { status: 404 }
      )
    }

    // 8. Get LP data
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, lp_number')
      .eq('id', lp_id)
      .single()

    if (lpError || !lp) {
      return NextResponse.json(
        { error: 'License plate not found', code: ERROR_CODES.WO_NOT_FOUND },
        { status: 404 }
      )
    }

    // 9. Calculate over-consumption
    const requiredQty = Number(material.required_qty || 0)
    const currentConsumed = Number(material.consumed_qty || 0)
    const totalAfter = currentConsumed + requested_qty

    if (totalAfter <= requiredQty) {
      return NextResponse.json(
        {
          error: 'This consumption does not exceed the BOM requirement',
          code: ERROR_CODES.NOT_OVER_CONSUMPTION,
        },
        { status: 400 }
      )
    }

    // 10. Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('over_consumption_approvals')
      .select('id')
      .eq('wo_material_id', wo_material_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'A pending approval request already exists',
          code: ERROR_CODES.PENDING_REQUEST_EXISTS,
        },
        { status: 400 }
      )
    }

    // 11. Calculate variance
    const overConsumptionQty = totalAfter - requiredQty
    const variancePercent = requiredQty > 0
      ? Math.round((overConsumptionQty / requiredQty) * 100 * 100) / 100
      : 0

    // 12. Create approval request
    const { data: newRequest, error: insertError } = await supabase
      .from('over_consumption_approvals')
      .insert({
        org_id: currentUser.org_id,
        wo_id: woId,
        wo_material_id: wo_material_id,
        lp_id: lp_id,
        requested_qty: requested_qty,
        current_consumed_qty: currentConsumed,
        required_qty: requiredQty,
        total_after_qty: totalAfter,
        over_consumption_qty: overConsumptionQty,
        variance_percent: variancePercent,
        requested_by: user.id,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError || !newRequest) {
      console.error('Error creating approval request:', insertError)
      return NextResponse.json(
        { error: 'Failed to create approval request' },
        { status: 500 }
      )
    }

    // 13. Return success response
    return NextResponse.json(
      {
        request_id: newRequest.id,
        status: 'pending',
        wo_id: woId,
        wo_number: workOrder.wo_number,
        wo_material_id: wo_material_id,
        product_code: '',
        product_name: material.material_name || '',
        lp_id: lp_id,
        lp_number: lp.lp_number,
        required_qty: requiredQty,
        current_consumed_qty: currentConsumed,
        requested_qty: requested_qty,
        total_after_qty: totalAfter,
        over_consumption_qty: overConsumptionQty,
        variance_percent: variancePercent,
        requested_by: user.id,
        requested_by_name: currentUser.full_name || '',
        requested_at: newRequest.requested_at,
        message: 'Over-consumption approval request created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/production/work-orders/:id/over-consumption/request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
