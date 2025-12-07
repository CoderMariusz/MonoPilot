// API Route: ASN Items Management
// Epic 5 Batch 5A-3 - Story 5.9: ASN Items Management
// GET /api/warehouse/asns/[id]/items - Get ASN items
// POST /api/warehouse/asns/[id]/items - Add/update ASN items
// PUT /api/warehouse/asns/[id]/items - Update single item

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/warehouse/asns/[id]/items - Get ASN items
export async function GET(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params
    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch items
    const { data, error } = await supabaseAdmin
      .from('asn_items')
      .select(`
        *,
        products!inner(id, code, name, uom)
      `)
      .eq('asn_id', id)
      .eq('org_id', currentUser.org_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching ASN items:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data || [] })
  } catch (error) {
    console.error('Error in GET /api/warehouse/asns/[id]/items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/warehouse/asns/[id]/items - Add new ASN item
export async function POST(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check ASN exists and is draft/submitted
    const { data: asn, error: fetchError } = await supabaseAdmin
      .from('asn')
      .select('id, status')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (fetchError || !asn) {
      return NextResponse.json({ error: 'ASN not found' }, { status: 404 })
    }

    if (!['draft', 'submitted'].includes(asn.status)) {
      return NextResponse.json(
        { error: 'ASN items can only be added in draft or submitted status' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      product_id,
      expected_qty,
      uom,
      supplier_batch_number,
      manufacture_date,
      expiry_date,
      po_line_id,
    } = body

    // Validate required fields
    if (!product_id || !expected_qty || !uom) {
      return NextResponse.json(
        { error: 'product_id, expected_qty, and uom are required' },
        { status: 400 }
      )
    }

    // Get next sequence number
    const { data: maxSeqData } = await supabaseAdmin
      .from('asn_items')
      .select('sequence')
      .eq('asn_id', id)
      .eq('org_id', currentUser.org_id)
      .order('sequence', { ascending: false })
      .limit(1)
      .single()

    const nextSequence = (maxSeqData?.sequence || 0) + 1

    // Create new item
    const newItem = {
      org_id: currentUser.org_id,
      asn_id: id,
      product_id,
      expected_qty,
      received_qty: 0,
      uom,
      sequence: nextSequence,
      supplier_batch_number: supplier_batch_number || null,
      manufacture_date: manufacture_date || null,
      expiry_date: expiry_date || null,
      po_line_id: po_line_id || null,
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('asn_items')
      .insert(newItem)
      .select(`
        *,
        products!inner(id, code, name, uom),
        po_lines(id, line_number, quantity)
      `)
      .single()

    if (insertError) {
      console.error('Error creating ASN item:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      item: data,
      message: 'ASN item created successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/warehouse/asns/[id]/items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

