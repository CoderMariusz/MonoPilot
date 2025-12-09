// API Route: License Plate Partial Move
// Epic 5 Batch 05B-1: Stock Moves (Story 5.16)
// POST /api/warehouse/license-plates/[id]/partial-move - Split LP and move portion to new location

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createServerSupabase()
    const adminClient = createAdminClient()

    // Auth check
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // AC-5.16.1: Authorization - warehouse, manager, admin
    if (!['warehouse', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse role or higher required' },
        { status: 403 }
      )
    }

    // Parse body
    const body = await request.json()
    const { quantity, to_location_id, notes } = body

    if (!quantity || !to_location_id) {
      return NextResponse.json(
        { error: 'Missing required fields: quantity, to_location_id' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 })
    }

    // Get LP
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('*')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (lpError || !lp) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    // AC-5.16.2: Validate quantity < current_qty
    if (quantity >= lp.current_qty) {
      return NextResponse.json(
        { error: 'Quantity must be less than current quantity. Use full move instead.' },
        { status: 400 }
      )
    }

    // AC-5.17.1: Validate destination location
    const { data: toLocation, error: locationError } = await supabase
      .from('locations')
      .select('id, code, name, is_active, type, warehouse_id')
      .eq('id', to_location_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (locationError || !toLocation) {
      return NextResponse.json({ error: 'Destination location not found' }, { status: 404 })
    }

    if (!toLocation.is_active) {
      return NextResponse.json(
        { error: 'Cannot move to inactive location' },
        { status: 400 }
      )
    }

    if (lp.location_id === to_location_id) {
      return NextResponse.json(
        { error: 'Destination location must be different from current location' },
        { status: 400 }
      )
    }

    const remainingQty = lp.current_qty - quantity

    // AC-5.16.3: Generate new LP number
    const { data: newLpNumber } = await adminClient.rpc('generate_lp_number', {
      p_org_id: currentUser.org_id,
      p_warehouse_id: toLocation.warehouse_id,
    })

    // AC-5.16.4: Create new LP at destination
    const { data: newLP, error: createError } = await adminClient
      .from('license_plates')
      .insert({
        org_id: currentUser.org_id,
        lp_number:
          newLpNumber ||
          `LP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        product_id: lp.product_id,
        quantity: quantity,
        current_qty: quantity,
        uom: lp.uom,
        status: 'available',
        qa_status: lp.qa_status,
        warehouse_id: toLocation.warehouse_id,
        location_id: to_location_id,
        batch_number: lp.batch_number,
        supplier_batch_number: lp.supplier_batch_number,
        manufacturing_date: lp.manufacturing_date,
        expiry_date: lp.expiry_date,
        received_date: lp.received_date,
        created_by: session.user.id,
      })
      .select(`
        *,
        product:products(id, code, name, type, uom),
        location:locations!location_id(id, code, name, type),
        warehouse:warehouses(id, code, name)
      `)
      .single()

    if (createError) {
      throw new Error(`Failed to create new LP: ${createError.message}`)
    }

    // AC-5.16.5: Update original LP quantity
    const { error: updateError } = await adminClient
      .from('license_plates')
      .update({
        current_qty: remainingQty,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      throw new Error(`Failed to update original LP: ${updateError.message}`)
    }

    // AC-5.16.6: Create genealogy record
    const { error: genealogyError } = await adminClient.from('lp_genealogy').insert({
      org_id: currentUser.org_id,
      parent_lp_id: id,
      child_lp_id: newLP.id,
      relationship_type: 'split',
      quantity_from_parent: quantity,
      uom: lp.uom,
      created_by: session.user.id,
    })

    if (genealogyError) {
      throw new Error(`Failed to create genealogy record: ${genealogyError.message}`)
    }

    // AC-5.16.7: Create movement records
    // Movement for original LP (reduction)
    await adminClient.from('lp_movements').insert({
      org_id: currentUser.org_id,
      lp_id: id,
      movement_type: 'split',
      qty_change: -quantity,
      qty_before: lp.current_qty,
      qty_after: remainingQty,
      uom: lp.uom,
      from_location_id: lp.location_id,
      created_by_user_id: session.user.id,
      notes: notes || `Partial move: ${quantity} ${lp.uom} to ${toLocation.code}`,
    })

    // Movement for new LP (creation + transfer)
    await adminClient.from('lp_movements').insert({
      org_id: currentUser.org_id,
      lp_id: newLP.id,
      movement_type: 'transfer',
      qty_change: quantity,
      qty_before: 0,
      qty_after: quantity,
      uom: lp.uom,
      from_location_id: lp.location_id,
      to_location_id: to_location_id,
      created_by_user_id: session.user.id,
      notes: notes || `Partial move from ${lp.lp_number}`,
    })

    // Get updated original LP
    const { data: updatedOriginalLP } = await supabase
      .from('license_plates')
      .select(`
        *,
        product:products(id, code, name, type, uom),
        location:locations!location_id(id, code, name, type),
        warehouse:warehouses(id, code, name)
      `)
      .eq('id', id)
      .single()

    return NextResponse.json({
      data: {
        original_lp: updatedOriginalLP,
        new_lp: newLP,
      },
      message: `Successfully moved ${quantity} ${lp.uom} to ${toLocation.code}`,
    })
  } catch (error) {
    console.error('Error in POST /api/warehouse/license-plates/[id]/partial-move:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
