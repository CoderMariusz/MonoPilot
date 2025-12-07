// API Route: ASN Item Detail
// Epic 5 Batch 5A-3 - Story 5.9: ASN Item Management
// GET /api/warehouse/asns/[id]/items/[itemId] - Get single ASN item
// PUT /api/warehouse/asns/[id]/items/[itemId] - Update ASN item
// DELETE /api/warehouse/asns/[id]/items/[itemId] - Delete ASN item

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>
}

// GET /api/warehouse/asns/[id]/items/[itemId] - Get single ASN item
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

    const { id, itemId } = await context.params
    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch item
    const { data, error } = await supabaseAdmin
      .from('asn_items')
      .select(`
        *,
        products!inner(id, code, name, uom),
        po_lines(id, line_number, quantity)
      `)
      .eq('id', itemId)
      .eq('asn_id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'ASN item not found' }, { status: 404 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error('Error in GET /api/warehouse/asns/[id]/items/[itemId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/warehouse/asns/[id]/items/[itemId] - Update ASN item
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

    const { id, itemId } = await context.params
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check ASN exists and is in editable state
    const { data: asn, error: asnError } = await supabaseAdmin
      .from('asn')
      .select('id, status')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (asnError || !asn) {
      return NextResponse.json({ error: 'ASN not found' }, { status: 404 })
    }

    if (!['draft', 'submitted'].includes(asn.status)) {
      return NextResponse.json(
        { error: 'ASN items can only be modified in draft or submitted status' },
        { status: 400 }
      )
    }

    // Check item exists and is not yet received
    const { data: existingItem, error: itemError } = await supabaseAdmin
      .from('asn_items')
      .select('id, received_qty')
      .eq('id', itemId)
      .eq('asn_id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (itemError || !existingItem) {
      return NextResponse.json({ error: 'ASN item not found' }, { status: 404 })
    }

    if (existingItem.received_qty > 0) {
      return NextResponse.json(
        { error: 'Cannot update item that has been partially or fully received' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      expected_qty,
      supplier_batch_number,
      manufacture_date,
      expiry_date,
    } = body

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (expected_qty !== undefined) updateData.expected_qty = expected_qty
    if (supplier_batch_number !== undefined) updateData.supplier_batch_number = supplier_batch_number
    if (manufacture_date !== undefined) updateData.manufacture_date = manufacture_date
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date

    // Update item
    const { data, error: updateError } = await supabaseAdmin
      .from('asn_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('asn_id', id)
      .eq('org_id', currentUser.org_id)
      .select(`
        *,
        products!inner(id, code, name, uom),
        po_lines(id, line_number, quantity)
      `)
      .single()

    if (updateError) {
      console.error('Error updating ASN item:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      item: data,
      message: 'ASN item updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/warehouse/asns/[id]/items/[itemId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/warehouse/asns/[id]/items/[itemId] - Delete ASN item
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { id, itemId } = await context.params
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check ASN exists and is in editable state
    const { data: asn, error: asnError } = await supabaseAdmin
      .from('asn')
      .select('id, status')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (asnError || !asn) {
      return NextResponse.json({ error: 'ASN not found' }, { status: 404 })
    }

    if (!['draft', 'submitted'].includes(asn.status)) {
      return NextResponse.json(
        { error: 'ASN items can only be deleted in draft or submitted status' },
        { status: 400 }
      )
    }

    // Check item exists and is not yet received
    const { data: existingItem, error: itemError } = await supabaseAdmin
      .from('asn_items')
      .select('id, received_qty')
      .eq('id', itemId)
      .eq('asn_id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (itemError || !existingItem) {
      return NextResponse.json({ error: 'ASN item not found' }, { status: 404 })
    }

    if (existingItem.received_qty > 0) {
      return NextResponse.json(
        { error: 'Cannot delete item that has been partially or fully received' },
        { status: 400 }
      )
    }

    // Delete item
    const { error: deleteError } = await supabaseAdmin
      .from('asn_items')
      .delete()
      .eq('id', itemId)
      .eq('asn_id', id)
      .eq('org_id', currentUser.org_id)

    if (deleteError) {
      console.error('Error deleting ASN item:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'ASN item deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/warehouse/asns/[id]/items/[itemId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
