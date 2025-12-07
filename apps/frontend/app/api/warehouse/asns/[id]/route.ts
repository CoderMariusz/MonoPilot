// API Route: ASN Detail
// Epic 5 Batch 5A-3 - Story 5.8: ASN Creation
// GET /api/warehouse/asns/[id] - Get ASN details
// PUT /api/warehouse/asns/[id] - Update ASN (draft only)

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/warehouse/asns/[id] - Get ASN details
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

    // Fetch ASN with items
    const { data, error } = await supabaseAdmin
      .from('asn')
      .select(`
        *,
        purchase_orders!inner(id, po_number),
        suppliers!inner(id, code, name),
        warehouses!inner(id, code, name),
        asn_items(
          *,
          products!inner(id, code, name, uom),
          po_lines!inner(id, line_number, quantity)
        )
      `)
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'ASN not found' }, { status: 404 })
    }

    return NextResponse.json({ asn: data })
  } catch (error) {
    console.error('Error in GET /api/warehouse/asns/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/warehouse/asns/[id] - Update ASN
export async function PUT(request: NextRequest, context: RouteContext) {
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

    // Check ASN exists
    const { data: existingASN, error: fetchError } = await supabaseAdmin
      .from('asn')
      .select('id, status')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (fetchError || !existingASN) {
      return NextResponse.json({ error: 'ASN not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { expected_arrival_date, carrier, tracking_number, notes, status } = body

    // If changing status to submitted, only allow from draft
    if (status === 'submitted' && existingASN.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only submit draft ASNs' },
        { status: 400 }
      )
    }

    // For other field updates, only allow on draft ASNs
    if (!status && existingASN.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft ASNs can be edited' },
        { status: 400 }
      )
    }

    // Prepare update data (only allowed fields)
    const updateData: any = {
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    }

    if (expected_arrival_date !== undefined) updateData.expected_arrival_date = expected_arrival_date
    if (carrier !== undefined) updateData.carrier = carrier
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) updateData.status = status

    // Update ASN
    const { data, error: updateError } = await supabaseAdmin
      .from('asn')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
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
      .single()

    if (updateError) {
      console.error('Error updating ASN:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      asn: data,
      message: 'ASN updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/warehouse/asns/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
