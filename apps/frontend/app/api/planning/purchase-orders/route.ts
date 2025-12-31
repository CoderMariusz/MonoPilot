// API Route: Purchase Orders Collection
// Epic 3 Batch 3A - Story 3.1: Purchase Order CRUD
// GET /api/planning/purchase-orders - List POs with filters
// POST /api/planning/purchase-orders - Create new PO

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { purchaseOrderSchema, type PurchaseOrderInput } from '@/lib/validation/planning-schemas'
import { generatePONumber } from '@/lib/utils/po-number-generator'
import { ZodError } from 'zod'

// GET /api/planning/purchase-orders - List purchase orders
export async function GET(request: NextRequest) {
  try {
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
    const { searchParams } = new URL(request.url)

    // Extract query parameters (AC-1.1: Filters)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const supplier_id = searchParams.get('supplier_id')
    const warehouse_id = searchParams.get('warehouse_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    let query = supabaseAdmin
      .from('purchase_orders')
      .select(`
        *,
        suppliers(id, code, name, currency),
        warehouses(id, code, name)
      `)
      .eq('org_id', currentUser.org_id)
      .order('po_number', { ascending: false })

    // Search filter (AC-1.1: Search by PO number or supplier name)
    if (search) {
      query = query.or(`po_number.ilike.%${search}%,suppliers.name.ilike.%${search}%`)
    }

    // Status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Supplier filter
    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id)
    }

    // Warehouse filter
    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id)
    }

    // Date range filters
    if (date_from) {
      query = query.gte('expected_delivery_date', date_from)
    }

    if (date_to) {
      query = query.lte('expected_delivery_date', date_to)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching purchase orders:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      purchase_orders: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/purchase-orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/planning/purchase-orders - Create new PO
export async function POST(request: NextRequest) {
  try {
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

    // Authorization: Purchasing, Manager, Admin
    if (!['purchasing', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Purchasing role or higher required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData: PurchaseOrderInput = purchaseOrderSchema.parse(body)

    const supabaseAdmin = createServerSupabaseAdmin()

    // AC-1.4: Fetch supplier to inherit currency, payment_terms
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('currency, tax_code_id, payment_terms')
      .eq('id', validatedData.supplier_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Check if warehouse exists
    const { data: warehouse } = await supabaseAdmin
      .from('warehouses')
      .select('id')
      .eq('id', validatedData.warehouse_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    // AC-1.5: Fetch planning settings for default status
    const { data: settings } = await supabaseAdmin
      .from('planning_settings')
      .select('po_default_status, po_require_approval, po_approval_threshold')
      .eq('org_id', currentUser.org_id)
      .single()

    const defaultStatus = settings?.po_default_status || 'draft'

    // AC-1.3: Generate PO number (PO-YYYY-NNNN)
    const po_number = await generatePONumber(currentUser.org_id)

    // Prepare PO data
    const poData = {
      org_id: currentUser.org_id,
      po_number,
      supplier_id: validatedData.supplier_id,
      warehouse_id: validatedData.warehouse_id,
      expected_delivery_date: validatedData.expected_delivery_date.toISOString().split('T')[0],
      payment_terms: validatedData.payment_terms || supplier.payment_terms,
      shipping_method: validatedData.shipping_method || null,
      notes: validatedData.notes || null,
      currency: supplier.currency, // AC-1.4: Inherit currency from supplier
      status: defaultStatus, // AC-1.5: Use default status from settings
      subtotal: 0,
      tax_amount: 0,
      total: 0,
      approval_status: null as string | null, // Set in AC-1.5 logic if needed
      created_by: session.user.id,
      updated_by: session.user.id,
    }

    // AC-1.5: Check if approval required
    if (settings?.po_require_approval) {
      // For now, new POs have total = 0, so approval logic will be triggered when lines are added
      // This will be handled in Story 3.4 (Approval Workflow)
      // If total > threshold, set approval_status = 'pending'
      if (settings.po_approval_threshold && 0 > settings.po_approval_threshold) {
        poData.approval_status = 'pending'
      }
    }

    // Insert PO
    const { data, error: insertError } = await supabaseAdmin
      .from('purchase_orders')
      .insert(poData)
      .select(`
        *,
        suppliers(id, code, name, currency),
        warehouses(id, code, name)
      `)
      .single()

    if (insertError) {
      console.error('Error creating purchase order:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        purchase_order: data,
        message: 'Purchase order created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
