/**
 * API Route: Short Pick
 * Story: 07.9 - Pick Confirmation Desktop
 *
 * POST /api/shipping/pick-lists/:id/lines/:lineId/short-pick - Confirm short pick with reason
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'
import { shortPickSchema } from '@/lib/validation/pick-confirmation-schemas'
import { WAREHOUSE_ELEVATED_ROLES } from '@/lib/constants/roles'
import { ZodError } from 'zod'

/**
 * POST /api/shipping/pick-lists/:id/lines/:lineId/short-pick
 * Confirm short pick with reason, create backorder
 *
 * AC-4: Short pick handling with reason and backorder creation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    // CSRF protection
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const { id: pickListId, lineId } = await params

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId, orgId, userRole } = authContext

    // Parse and validate request body
    const body = await request.json()
    const validatedData = shortPickSchema.parse(body)

    const now = new Date().toISOString()

    // Get pick list
    const { data: pickList, error: plError } = await supabase
      .from('pick_lists')
      .select('id, status, assigned_to')
      .eq('id', pickListId)
      .eq('org_id', orgId)
      .single()

    if (plError || !pickList) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Pick list not found' } },
        { status: 404 }
      )
    }

    // Validate permission
    const hasElevatedRole = WAREHOUSE_ELEVATED_ROLES.includes(userRole.toLowerCase() as typeof WAREHOUSE_ELEVATED_ROLES[number])
    if (pickList.assigned_to !== userId && !hasElevatedRole) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    // Validate pick list status
    if (pickList.status !== 'in_progress') {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Pick list not in progress' } },
        { status: 409 }
      )
    }

    // Get pick list line
    const { data: line, error: lineError } = await supabase
      .from('pick_list_lines')
      .select(`
        id,
        pick_list_id,
        sales_order_line_id,
        license_plate_id,
        quantity_to_pick,
        quantity_picked,
        status
      `)
      .eq('id', lineId)
      .eq('pick_list_id', pickListId)
      .eq('org_id', orgId)
      .single()

    if (lineError || !line) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Pick list line not found' } },
        { status: 404 }
      )
    }

    // Validate line status
    if (line.status !== 'pending') {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Line already picked' } },
        { status: 409 }
      )
    }

    // Validate short pick quantity (must be less than required)
    const qtyToPick = Number(line.quantity_to_pick)
    if (validatedData.quantity_picked >= qtyToPick) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Quantity must be less than required for short pick' } },
        { status: 400 }
      )
    }

    if (validatedData.quantity_picked < 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Quantity cannot be negative' } },
        { status: 400 }
      )
    }

    const lpId = validatedData.picked_license_plate_id || line.license_plate_id
    const shortQuantity = qtyToPick - validatedData.quantity_picked
    const backorderQuantity = shortQuantity

    // Build notes
    const notesText = validatedData.notes
      ? `${validatedData.reason} - ${validatedData.notes}`
      : validatedData.reason

    // === TRANSACTION: Update tables ===

    // 1. Update pick_list_lines
    const { error: lineUpdateError } = await supabase
      .from('pick_list_lines')
      .update({
        quantity_picked: validatedData.quantity_picked,
        status: 'short',
        picked_at: now,
        picked_by: userId,
        picked_license_plate_id: lpId,
        notes: notesText,
      })
      .eq('id', lineId)
      .eq('org_id', orgId)

    if (lineUpdateError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to update pick list line' } },
        { status: 500 }
      )
    }

    // 2. Update inventory_allocations
    await supabase
      .from('inventory_allocations')
      .update({
        quantity_picked: validatedData.quantity_picked,
      })
      .eq('sales_order_line_id', line.sales_order_line_id)
      .eq('license_plate_id', lpId)
      .eq('org_id', orgId)
      .is('released_at', null)

    // 3. Update sales_order_lines with picked qty and backorder
    const { data: soLine } = await supabase
      .from('sales_order_lines')
      .select('quantity_picked')
      .eq('id', line.sales_order_line_id)
      .single()

    const newQtyPicked = Number(soLine?.quantity_picked || 0) + validatedData.quantity_picked

    await supabase
      .from('sales_order_lines')
      .update({
        quantity_picked: newQtyPicked,
        backorder_quantity: backorderQuantity,
        backorder_flag: true,
      })
      .eq('id', line.sales_order_line_id)

    // 4. Update license_plates (if picked any qty)
    if (validatedData.quantity_picked > 0 && lpId) {
      const { data: lp } = await supabase
        .from('license_plates')
        .select('quantity, allocated_quantity')
        .eq('id', lpId)
        .eq('org_id', orgId)
        .single()

      if (lp) {
        const newQtyOnHand = Number(lp.quantity) - validatedData.quantity_picked
        const newAllocatedQty = Math.max(0, Number(lp.allocated_quantity || 0) - validatedData.quantity_picked)

        await supabase
          .from('license_plates')
          .update({
            quantity: newQtyOnHand,
            allocated_quantity: newAllocatedQty,
          })
          .eq('id', lpId)
          .eq('org_id', orgId)
      }
    }

    // Get all lines for progress calculation
    const { data: allLines } = await supabase
      .from('pick_list_lines')
      .select('status')
      .eq('pick_list_id', pickListId)
      .eq('org_id', orgId)

    const pickedCount = (allLines || []).filter((l: any) => l.status === 'picked').length
    const shortCount = (allLines || []).filter((l: any) => l.status === 'short').length
    const totalCount = (allLines || []).length
    const percentage = totalCount > 0 ? Math.round(((pickedCount + shortCount) / totalCount) * 100) : 0

    return NextResponse.json({
      success: true,
      line: {
        id: lineId,
        status: 'short',
        quantity_picked: validatedData.quantity_picked,
        picked_at: now,
      },
      short_quantity: shortQuantity,
      backorder_created: true,
      backorder_quantity: backorderQuantity,
      progress: {
        picked_count: pickedCount,
        short_count: shortCount,
        total_count: totalCount,
        percentage,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/shipping/pick-lists/:id/lines/:lineId/short-pick:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation failed',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
