/**
 * API Route: SO Line Detail
 * Story: 07.4 - SO Line Pricing
 *
 * GET /api/shipping/sales-orders/:id/lines/:lineId - Get single line
 * PUT /api/shipping/sales-orders/:id/lines/:lineId - Update line
 * DELETE /api/shipping/sales-orders/:id/lines/:lineId - Delete line
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateSOLineSchema } from '@/lib/validation/pricing-schemas'
import { calculateLineTotal, calculateOrderTotal } from '@/lib/services/so-pricing-service'
import { ZodError } from 'zod'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

interface RouteParams {
  params: Promise<{ id: string; lineId: string }>
}

/**
 * GET /api/shipping/sales-orders/:id/lines/:lineId
 * Get single SO line with product info
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const supabase = await createServerSupabase()
    const { id: soId, lineId } = await context.params

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Get SO line with product info
    const { data: line, error } = await supabase
      .from('sales_order_lines')
      .select(`
        *,
        product:products(id, code, name, std_price)
      `)
      .eq('id', lineId)
      .eq('sales_order_id', soId)
      .eq('org_id', orgId)
      .single()

    if (error || !line) {
      return NextResponse.json({ error: 'Line not found' }, { status: 404 })
    }

    return NextResponse.json(line)
  } catch (error) {
    console.error('Error in GET /api/shipping/sales-orders/:id/lines/:lineId:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

/**
 * PUT /api/shipping/sales-orders/:id/lines/:lineId
 * Update SO line with recalculation of totals
 *
 * AC6: Recalculate totals on line edit
 */
export async function PUT(
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

    // Check role permissions
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
    const validatedData = updateSOLineSchema.parse(body)

    // Merge with existing values
    const quantity = validatedData.quantity_ordered ?? existingLine.quantity_ordered
    const unitPrice = validatedData.unit_price ?? existingLine.unit_price
    const discount = validatedData.discount !== undefined
      ? validatedData.discount
      : existingLine.discount

    // AC6: Recalculate line total
    const lineTotal = calculateLineTotal(quantity, unitPrice, discount)

    // Update the line
    const { data: updatedLine, error: updateError } = await supabase
      .from('sales_order_lines')
      .update({
        quantity_ordered: quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        discount: discount ?? null,
        requested_lot: validatedData.requested_lot !== undefined
          ? validatedData.requested_lot
          : existingLine.requested_lot,
        notes: validatedData.notes !== undefined
          ? validatedData.notes
          : existingLine.notes,
      })
      .eq('id', lineId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update SO line:', updateError)
      return NextResponse.json({ error: 'Failed to update line' }, { status: 500 })
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
    console.error('Error in PUT /api/shipping/sales-orders/:id/lines/:lineId:', error)

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

/**
 * DELETE /api/shipping/sales-orders/:id/lines/:lineId
 * Delete SO line and recalculate totals
 *
 * AC7: Recalculate totals on line delete
 */
export async function DELETE(
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

    // Check role permissions
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

    // Verify line exists
    const { data: existingLine, error: lineError } = await supabase
      .from('sales_order_lines')
      .select('id')
      .eq('id', lineId)
      .eq('sales_order_id', soId)
      .eq('org_id', orgId)
      .single()

    if (lineError || !existingLine) {
      return NextResponse.json({ error: 'Line not found' }, { status: 404 })
    }

    // Delete the line
    const { error: deleteError } = await supabase
      .from('sales_order_lines')
      .delete()
      .eq('id', lineId)
      .eq('org_id', orgId)

    if (deleteError) {
      console.error('Failed to delete SO line:', deleteError)
      return NextResponse.json({ error: 'Failed to delete line' }, { status: 500 })
    }

    // AC7: Recalculate SO total_amount after deletion
    const { data: remainingLines } = await supabase
      .from('sales_order_lines')
      .select('line_total')
      .eq('sales_order_id', soId)
      .eq('org_id', orgId)

    const soTotal = calculateOrderTotal(remainingLines || [])

    // Update SO total
    await supabase
      .from('sales_orders')
      .update({ total_amount: soTotal })
      .eq('id', soId)
      .eq('org_id', orgId)

    return NextResponse.json({
      success: true,
      so_total: soTotal,
    })
  } catch (error) {
    console.error('Error in DELETE /api/shipping/sales-orders/:id/lines/:lineId:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
