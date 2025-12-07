// API Route: GRN Collection
// Epic 5 Batch 5A-3 - Story 5.11: GRN + LP Creation
// GET /api/warehouse/grns - List GRNs with filters
// POST /api/warehouse/grns - Create new GRN from ASN

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { generateGRNNumber } from '@/lib/utils/grn-number-generator'

// GET /api/warehouse/grns - List GRNs
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
    const asn_id = searchParams.get('asn_id')
    const po_id = searchParams.get('po_id')
    const warehouse_id = searchParams.get('warehouse_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    let query = supabaseAdmin
      .from('goods_receipt_notes')
      .select(`
        *,
        asn!left(id, asn_number),
        purchase_orders!left(id, po_number),
        warehouses!inner(id, code, name),
        locations!left(id, code, name),
        grn_items(count)
      `)
      .eq('org_id', currentUser.org_id)
      .order('created_at', { ascending: false })

    // Status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // ASN filter
    if (asn_id) {
      query = query.eq('asn_id', asn_id)
    }

    // PO filter
    if (po_id) {
      query = query.eq('po_id', po_id)
    }

    // Warehouse filter
    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id)
    }

    // Date range filters
    if (date_from) {
      query = query.gte('created_at', date_from)
    }
    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching GRNs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      grns: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/grns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/warehouse/grns - Create new GRN from ASN
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
    const { asn_id, warehouse_id, receiving_location_id, notes } = body

    // Validate required fields
    if (!asn_id || !warehouse_id) {
      return NextResponse.json(
        { error: 'Missing required fields: asn_id, warehouse_id' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Validate ASN exists and status is submitted or receiving
    const { data: asn, error: asnError } = await supabaseAdmin
      .from('asn')
      .select('id, asn_number, po_id, warehouse_id, status')
      .eq('id', asn_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (asnError || !asn) {
      return NextResponse.json({ error: 'ASN not found' }, { status: 404 })
    }

    if (!['submitted', 'receiving'].includes(asn.status)) {
      return NextResponse.json(
        { error: 'ASN must be submitted or in receiving status to create GRN' },
        { status: 400 }
      )
    }

    // Validate warehouse matches ASN
    if (asn.warehouse_id !== warehouse_id) {
      return NextResponse.json(
        { error: 'Warehouse must match ASN warehouse' },
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

    // Validate receiving location if provided
    if (receiving_location_id) {
      const { data: location } = await supabaseAdmin
        .from('locations')
        .select('id, warehouse_id')
        .eq('id', receiving_location_id)
        .eq('org_id', currentUser.org_id)
        .single()

      if (!location) {
        return NextResponse.json({ error: 'Receiving location not found' }, { status: 404 })
      }

      if (location.warehouse_id !== warehouse_id) {
        return NextResponse.json(
          { error: 'Receiving location must be in the same warehouse' },
          { status: 400 }
        )
      }
    }

    // Generate GRN number
    const grn_number = await generateGRNNumber(currentUser.org_id)

    // Prepare GRN data
    const grnData = {
      org_id: currentUser.org_id,
      grn_number,
      asn_id,
      po_id: asn.po_id,
      warehouse_id,
      receiving_location_id: receiving_location_id || null,
      status: 'draft',
      notes: notes || null,
      received_by: session.user.id,
    }

    // Create GRN
    const { data: createdGRN, error: insertError } = await supabaseAdmin
      .from('goods_receipt_notes')
      .insert(grnData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating GRN:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Fetch ASN items to create GRN items
    const { data: asnItems, error: asnItemsError } = await supabaseAdmin
      .from('asn_items')
      .select('*')
      .eq('asn_id', asn_id)
      .eq('org_id', currentUser.org_id)

    if (asnItemsError) {
      console.error('Error fetching ASN items:', asnItemsError)
      // Rollback: delete created GRN
      await supabaseAdmin.from('goods_receipt_notes').delete().eq('id', createdGRN.id)
      return NextResponse.json({ error: asnItemsError.message }, { status: 500 })
    }

    // Create GRN items from ASN items (without LPs yet - created during receiving)
    const grnItems = (asnItems || []).map((item: any) => ({
      org_id: currentUser.org_id,
      grn_id: createdGRN.id,
      asn_item_id: item.id,
      product_id: item.product_id,
      expected_qty: item.expected_qty,
      received_qty: 0,
      uom: item.uom,
      lp_id: null, // Will be set during receiving
    }))

    if (grnItems.length > 0) {
      const { error: itemsError } = await supabaseAdmin.from('grn_items').insert(grnItems)

      if (itemsError) {
        console.error('Error creating GRN items:', itemsError)
        // Rollback: delete created GRN
        await supabaseAdmin.from('goods_receipt_notes').delete().eq('id', createdGRN.id)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
    }

    // Update ASN status to 'receiving'
    await supabaseAdmin.from('asn').update({ status: 'receiving' }).eq('id', asn_id)

    // Fetch complete GRN with items
    const { data: completeGRN } = await supabaseAdmin
      .from('goods_receipt_notes')
      .select(`
        *,
        asn!left(id, asn_number),
        purchase_orders!left(id, po_number),
        warehouses!inner(id, code, name),
        locations!left(id, code, name),
        grn_items(
          *,
          products!inner(id, code, name, uom)
        )
      `)
      .eq('id', createdGRN.id)
      .single()

    return NextResponse.json(
      {
        grn: completeGRN,
        message: 'GRN created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/grns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
