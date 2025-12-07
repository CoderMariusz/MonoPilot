// API Route: GRN Detail
// Epic 5 Batch 5A-3 - Story 5.11: GRN + LP Creation
// GET /api/warehouse/grns/[id] - Get GRN details with items and LPs
// PUT /api/warehouse/grns/[id] - Update GRN (only draft/in_progress)

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/warehouse/grns/[id] - Get GRN details
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

    const supabaseAdmin = createServerSupabaseAdmin()
    const { id } = await context.params

    // Fetch GRN with all details
    const { data: grn, error } = await supabaseAdmin
      .from('goods_receipt_notes')
      .select(`
        *,
        asn!left(id, asn_number),
        purchase_orders!left(id, po_number),
        warehouses!inner(id, code, name),
        locations!left(id, code, name),
        grn_items(
          *,
          products!inner(id, code, name, uom),
          asn_items!left(
            id,
            supplier_batch_number,
            manufacture_date,
            expiry_date
          ),
          license_plates!left(
            id,
            lp_number,
            quantity,
            current_qty,
            status,
            qa_status,
            location_id,
            expiry_date
          )
        )
      `)
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (error) {
      console.error('Error fetching GRN:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ grn })
  } catch (error) {
    console.error('Error in GET /api/warehouse/grns/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/warehouse/grns/[id] - Update GRN
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

    const supabaseAdmin = createServerSupabaseAdmin()
    const { id } = await context.params
    const body = await request.json()
    const { status, receiving_location_id, notes } = body

    // Fetch current GRN
    const { data: currentGRN, error: fetchError } = await supabaseAdmin
      .from('goods_receipt_notes')
      .select('id, status, org_id')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (fetchError || !currentGRN) {
      return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
    }

    // Only allow updates for draft/in_progress status
    if (!['draft', 'in_progress'].includes(currentGRN.status)) {
      return NextResponse.json(
        { error: 'Can only update GRN in draft or in_progress status' },
        { status: 400 }
      )
    }

    // Validate status transition if status is being updated
    if (status) {
      const validStatuses = ['draft', 'in_progress', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
    }

    // Build update object
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (receiving_location_id !== undefined) updateData.receiving_location_id = receiving_location_id
    if (notes !== undefined) updateData.notes = notes

    // Update GRN
    const { data: updatedGRN, error: updateError } = await supabaseAdmin
      .from('goods_receipt_notes')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
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
      .single()

    if (updateError) {
      console.error('Error updating GRN:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      grn: updatedGRN,
      message: 'GRN updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/warehouse/grns/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
