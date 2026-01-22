/**
 * API Route: SO Line Pricing
 * Story: 07.4 - SO Line Pricing
 *
 * PATCH /api/shipping/sales-orders/:id/lines/:lineId/pricing
 * Update only pricing fields (unit_price, discount) with recalculation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateLinePricingSchema } from '@/lib/validation/pricing-schemas'
import { calculateLineTotal, calculateOrderTotal } from '@/lib/services/so-pricing-service'
import { ZodError } from 'zod'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

interface RouteParams {
  params: Promise<{ id: string; lineId: string }>
}

/**
 * PATCH /api/shipping/sales-orders/:id/lines/:lineId/pricing
 * Update pricing fields only (unit_price and/or discount)
 *
 * This endpoint is optimized for pricing-only updates and:
 * - Validates pricing fields (unit_price > 0, discount >= 0, percent <= 100%)
 * - Recalculates line_total
 * - Recalculates SO total_amount
 */
export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // CSRF protection
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const supabase = await createServerSupabase()
    const { id: soId, lineId } = await context.params

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Check role permissions (sales, manager, admin can update pricing)
    const allowedRoles = ['owner', 'admin', 'manager', 'sales']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return permissionError
    }

    const { orgId } = authContext

    // Verify SO exists, belongs to org, and is draft
    const { data: so, error: soError } = await supabase
      .from('sales_orders')
      .select('id, status')
      .eq('id', soId)
      .eq('org_id', orgId)
      .single()

    if (soError || !so) {
      return NextResponse.json({ error: 'Sales order not found' }, { status: 404 })
    }

    if (so.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot modify non-draft sales order', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Get existing line
    const { data: existingLine, error: lineError } = await supabase
      .from('sales_order_lines')
      .select('*')
      .eq('id', lineId)
      .eq('sales_order_id', soId)
      .eq('org_id', orgId)
      .single()

    if (lineError || !existingLine) {
      return NextResponse.json({ error: 'Line not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateLinePricingSchema.parse(body)

    // Merge pricing fields with existing values
    const unitPrice = validatedData.unit_price ?? existingLine.unit_price
    const discount = validatedData.discount !== undefined
      ? validatedData.discount
      : existingLine.discount

    // Recalculate line total with existing quantity
    const lineTotal = calculateLineTotal(
      existingLine.quantity_ordered,
      unitPrice,
      discount
    )

    // Update only pricing fields
    const { data: updatedLine, error: updateError } = await supabase
      .from('sales_order_lines')
      .update({
        unit_price: unitPrice,
        line_total: lineTotal,
        discount: discount ?? null,
      })
      .eq('id', lineId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update SO line pricing:', updateError)
      return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 })
    }

    // Recalculate SO total_amount
    const { data: allLines } = await supabase
      .from('sales_order_lines')
      .select('line_total')
      .eq('sales_order_id', soId)
      .eq('org_id', orgId)

    const soTotal = calculateOrderTotal(allLines || [])

    // Update SO total
    await supabase
      .from('sales_orders')
      .update({ total_amount: soTotal })
      .eq('id', soId)
      .eq('org_id', orgId)

    return NextResponse.json({
      success: true,
      line: updatedLine,
      so_total: soTotal,
    })
  } catch (error) {
    console.error('Error in PATCH /api/shipping/sales-orders/:id/lines/:lineId/pricing:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
