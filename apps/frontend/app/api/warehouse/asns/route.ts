// API Route: ASN Collection
// Epic 5 Batch 5A-3 - Story 5.8: ASN Creation
// GET /api/warehouse/asns - List ASNs with filters
// POST /api/warehouse/asns - Create new ASN from PO

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { generateASNNumber } from '@/lib/utils/asn-number-generator'

// GET /api/warehouse/asns - List ASNs
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
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabaseAdmin = createServerSupabaseAdmin()
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const status = searchParams.get('status')
    const po_id = searchParams.get('po_id')
    const warehouse_id = searchParams.get('warehouse_id')

    let query = supabaseAdmin
      .from('asn')
      .select(`
        *,
        purchase_orders!inner(id, po_number),
        suppliers!inner(id, code, name),
        warehouses!inner(id, code, name),
        asn_items(count)
      `)
      .eq('org_id', currentUser.org_id)
      .order('created_at', { ascending: false })

    // Status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // PO filter
    if (po_id) {
      query = query.eq('po_id', po_id)
    }

    // Warehouse filter
    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching ASNs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      asns: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/asns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/warehouse/asns - Create new ASN
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
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: Warehouse, Manager, Admin
    if (!['warehouse', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse role or higher required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      po_id,
      warehouse_id,
      expected_arrival_date,
      carrier,
      tracking_number,
      notes,
      items,
    } = body

    // Validate required fields
    if (!po_id || !warehouse_id) {
      return NextResponse.json(
        { error: 'Missing required fields: po_id, warehouse_id' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Validate PO exists and status is confirmed or higher
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, po_number, supplier_id, status')
      .eq('id', po_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (poError || !po) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 })
    }

    if (!['confirmed', 'approved', 'partially_received', 'received'].includes(po.status)) {
      return NextResponse.json(
        { error: 'Purchase Order must be confirmed or higher status to create ASN' },
        { status: 400 }
      )
    }

    // Validate supplier_id exists
    if (!po.supplier_id) {
      return NextResponse.json(
        { error: 'Purchase Order must have a supplier to create ASN' },
        { status: 400 }
      )
    }

    // Validate warehouse exists
    const { data: warehouse } = await supabaseAdmin
      .from('warehouses')
      .select('id')
      .eq('id', warehouse_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    // Generate ASN number
    const asn_number = await generateASNNumber(currentUser.org_id)

    // Prepare ASN data
    const asnData = {
      org_id: currentUser.org_id,
      asn_number,
      po_id,
      supplier_id: po.supplier_id,
      warehouse_id,
      expected_arrival_date: expected_arrival_date || null,
      carrier: carrier || null,
      tracking_number: tracking_number || null,
      status: 'draft',
      notes: notes || null,
      created_by: session.user.id,
      updated_by: session.user.id,
    }

    // Start transaction: Insert ASN
    const { data: createdASN, error: insertError } = await supabaseAdmin
      .from('asn')
      .insert(asnData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating ASN:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Prepare items: either from request or auto-fill from PO lines
    let asnItems = []

    if (items && items.length > 0) {
      // Use provided items
      asnItems = items.map((item: any) => ({
        org_id: currentUser.org_id,
        asn_id: createdASN.id,
        po_line_id: item.po_line_id,
        product_id: item.product_id,
        expected_qty: item.expected_qty,
        received_qty: 0,
        uom: item.uom,
        supplier_batch_number: item.supplier_batch_number || null,
        manufacture_date: item.manufacture_date || null,
        expiry_date: item.expiry_date || null,
      }))
    } else {
      // Auto-fill from PO lines
      const { data: poLines, error: linesError } = await supabaseAdmin
        .from('po_lines')
        .select('id, product_id, quantity, uom')
        .eq('po_id', po_id)
        .eq('org_id', currentUser.org_id)

      if (linesError) {
        console.error('Error fetching PO lines:', linesError)
        return NextResponse.json({ error: linesError.message }, { status: 500 })
      }

      asnItems = (poLines || []).map((line: any) => ({
        org_id: currentUser.org_id,
        asn_id: createdASN.id,
        po_line_id: line.id,
        product_id: line.product_id,
        expected_qty: line.quantity,
        received_qty: 0,
        uom: line.uom,
        supplier_batch_number: null,
        manufacture_date: null,
        expiry_date: null,
      }))
    }

    // Insert ASN items
    if (asnItems.length > 0) {
      const { error: itemsError } = await supabaseAdmin.from('asn_items').insert(asnItems)

      if (itemsError) {
        console.error('Error creating ASN items:', itemsError)
        // Rollback: delete created ASN
        await supabaseAdmin.from('asn').delete().eq('id', createdASN.id)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
    }

    // Fetch complete ASN with items
    const { data: completeASN } = await supabaseAdmin
      .from('asn')
      .select(`
        *,
        purchase_orders!inner(id, po_number),
        suppliers!inner(id, code, name),
        warehouses!inner(id, code, name),
        asn_items(
          *,
          products!inner(id, code, name, uom)
        )
      `)
      .eq('id', createdASN.id)
      .single()

    return NextResponse.json(
      {
        asn: completeASN,
        message: 'ASN created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/asns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
