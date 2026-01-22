/**
 * API Route: SO Lines Management
 * Story: 07.4 - SO Line Pricing
 *
 * POST /api/shipping/sales-orders/:id/lines - Create new line with pricing
 * GET /api/shipping/sales-orders/:id/lines - List lines for SO
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createSOLineSchema } from '@/lib/validation/pricing-schemas'
import {
  calculateLineTotal,
  getProductPrice,
  calculateOrderTotal,
} from '@/lib/services/so-pricing-service'
import { ZodError } from 'zod'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/shipping/sales-orders/:id/lines
 * List lines for a sales order
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const supabase = await createServerSupabase()
    const { id: soId } = await context.params

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Get SO lines with product info
    const { data: lines, error } = await supabase
      .from('sales_order_lines')
      .select(`
        *,
        product:products(id, code, name, std_price)
      `)
      .eq('sales_order_id', soId)
      .eq('org_id', orgId)
      .order('line_number', { ascending: true })

    if (error) {
      console.error('Failed to fetch SO lines:', error)
      return NextResponse.json({ error: 'Failed to fetch lines' }, { status: 500 })
    }

    return NextResponse.json({ data: lines || [] })
  } catch (error) {
    console.error('Error in GET /api/shipping/sales-orders/:id/lines:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

/**
 * POST /api/shipping/sales-orders/:id/lines
 * Create a new SO line with pricing calculation
 *
 * AC1: Auto-populate unit_price from product master
 * AC2: Calculate line_total on quantity/price change
 * AC3: Apply percentage discount to line
 * AC4: Apply fixed discount to line
 * AC5: Calculate SO total_amount from all lines
 */
export async function POST(
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
    const { id: soId } = await context.params

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Check role permissions (sales, manager, admin can create)
    const allowedRoles = ['owner', 'admin', 'manager', 'sales']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return permissionError
    }

    const { orgId } = authContext

    // Verify SO exists, belongs to org, and is draft
    const { data: so, error: soError } = await supabase
      .from('sales_orders')
      .select('id, status, total_amount')
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createSOLineSchema.parse(body)

    // Get unit price - use provided or fetch from product
    let unitPrice = validatedData.unit_price
    if (unitPrice === undefined) {
      // AC1: Auto-populate from product.std_price
      const productPrice = await getProductPrice(validatedData.product_id)
      if (productPrice === null) {
        return NextResponse.json(
          { error: 'Product not found or has no standard price', code: 'PRODUCT_NOT_FOUND' },
          { status: 400 }
        )
      }
      unitPrice = productPrice
    }

    // AC2/AC3/AC4: Calculate line total with discount
    const lineTotal = calculateLineTotal(
      validatedData.quantity_ordered,
      unitPrice,
      validatedData.discount
    )

    // Get next line number
    const { data: lastLine } = await supabase
      .from('sales_order_lines')
      .select('line_number')
      .eq('sales_order_id', soId)
      .order('line_number', { ascending: false })
      .limit(1)
      .single()

    const lineNumber = lastLine ? lastLine.line_number + 1 : 1

    // Create the line
    const { data: newLine, error: createError } = await supabase
      .from('sales_order_lines')
      .insert({
        org_id: orgId,
        sales_order_id: soId,
        line_number: lineNumber,
        product_id: validatedData.product_id,
        quantity_ordered: validatedData.quantity_ordered,
        unit_price: unitPrice,
        line_total: lineTotal,
        discount: validatedData.discount ?? null,
        requested_lot: validatedData.requested_lot ?? null,
        notes: validatedData.notes ?? null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create SO line:', createError)
      return NextResponse.json({ error: 'Failed to create line' }, { status: 500 })
    }

    // AC5: Recalculate SO total_amount
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

    return NextResponse.json(
      {
        success: true,
        line: newLine,
        so_total: soTotal,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/shipping/sales-orders/:id/lines:', error)

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
