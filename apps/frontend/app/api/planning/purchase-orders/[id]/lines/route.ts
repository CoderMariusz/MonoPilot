// API Route: Purchase Order Lines Collection
// Epic 3 Batch 3A - Story 3.2: PO Line Management
// GET /api/planning/purchase-orders/:id/lines - Get all lines for PO
// POST /api/planning/purchase-orders/:id/lines - Add new line to PO

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { poLineSchema, type POLineInput } from '@/lib/validation/planning-schemas'
import { checkPOPermission, getPermissionRequirement } from '@/lib/utils/po-permissions'
import { ZodError } from 'zod'

// GET /api/planning/purchase-orders/:id/lines - Get all PO lines
export async function GET(
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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify PO exists and belongs to user's org
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, org_id')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // AC-2.2: Fetch PO lines with product details
    // Note: purchase_order_lines doesn't have org_id, RLS is via po_id FK
    const { data, error } = await supabaseAdmin
      .from('purchase_order_lines')
      .select(`
        *,
        products(id, code, name, base_uom)
      `)
      .eq('po_id', id)
      .order('line_number', { ascending: true })

    if (error) {
      console.error('Error fetching PO lines:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      lines: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/purchase-orders/:id/lines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/planning/purchase-orders/:id/lines - Add new PO line
export async function POST(
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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: MAJOR-02 Fix - Use centralized permission check
    if (!checkPOPermission(currentUser, 'addLines')) {
      return NextResponse.json(
        { error: `Forbidden: ${getPermissionRequirement('addLines')} required` },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData: POLineInput = poLineSchema.parse(body)

    const supabaseAdmin = createServerSupabaseAdmin()

    // AC-2.8: Check PO status - Cannot add lines if Closed or Receiving
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('status, org_id, supplier_id, currency')
      .eq('id', id)
      .single()

    if (poError || !po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Verify org_id isolation
    if (po.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // AC-2.8: Validation - Cannot add/edit/delete lines if status = 'Closed' or 'Receiving'
    if (['closed', 'receiving'].includes(po.status.toLowerCase())) {
      return NextResponse.json(
        { error: 'Cannot add lines to PO in Closed or Receiving status' },
        { status: 403 }
      )
    }

    // Get product details (base_uom)
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('base_uom')
      .eq('id', validatedData.product_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // AC-2.5: Get tax rate from supplier's tax code
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('tax_code_id, tax_codes(rate)')
      .eq('id', po.supplier_id)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const tax_rate = (supplier.tax_codes as any)?.rate || 0

    // Get next sequence number
    const { count } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('*', { count: 'exact', head: true })
      .eq('po_id', id)

    const sequence = (count || 0) + 1

    // AC-2.1: Calculate line amounts
    const line_subtotal = Number(validatedData.quantity) * Number(validatedData.unit_price)
    const discount_amount = line_subtotal * (Number(validatedData.discount_percent || 0) / 100)
    const line_total = line_subtotal - discount_amount
    const tax_amount = line_total * (tax_rate / 100)
    const line_total_with_tax = line_total + tax_amount

    // Prepare line data (no org_id - purchase_order_lines uses po_id FK for RLS)
    const lineData = {
      po_id: id,
      product_id: validatedData.product_id,
      line_number: sequence,
      quantity: validatedData.quantity,
      uom: product.base_uom,
      unit_price: validatedData.unit_price,
      discount_percent: validatedData.discount_percent || 0,
      discount_amount: Number(discount_amount.toFixed(2)),
      line_total: Number(line_total.toFixed(2)),
      expected_delivery_date: validatedData.expected_delivery_date
        ? validatedData.expected_delivery_date.toISOString().split('T')[0]
        : null,
    }

    // Insert line
    const { data, error: insertError } = await supabaseAdmin
      .from('purchase_order_lines')
      .insert(lineData)
      .select(`
        *,
        products(id, code, name, base_uom)
      `)
      .single()

    if (insertError) {
      console.error('Error creating PO line:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // AC-2.6: Trigger recalculates PO totals automatically

    return NextResponse.json(
      {
        line: data,
        message: 'PO line added successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/:id/lines:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
