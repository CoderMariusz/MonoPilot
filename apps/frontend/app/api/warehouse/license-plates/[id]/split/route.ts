// API Route: License Plate Split
// Epic 5 Batch 05A-2: LP Operations (Story 5.5)
// POST /api/warehouse/license-plates/[id]/split - Split LP into multiple smaller LPs

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { getLP } from '@/lib/services/license-plate-service'

// POST /api/warehouse/license-plates/[id]/split - Split LP
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()
    const adminClient = createAdminClient()

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
      .select('org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: Warehouse, Production, Manager, Admin
    if (!['warehouse', 'production', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse role or higher required' },
        { status: 403 }
      )
    }

    // Get existing LP to check org and status
    const existingLP = await getLP(id)
    if (!existingLP) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    if (existingLP.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // AC-5.5.6: Reject if LP status is not 'available'
    if (existingLP.status !== 'available') {
      return NextResponse.json(
        { error: 'Can only split available license plates' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { quantities } = body

    if (!quantities || !Array.isArray(quantities) || quantities.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: quantities (must be non-empty array)' },
        { status: 400 }
      )
    }

    // AC-5.5.5: Validate quantities sum equals original LP current_qty
    const totalQuantity = quantities.reduce((sum: number, qty: number) => sum + qty, 0)
    if (Math.abs(totalQuantity - existingLP.current_qty) > 0.001) {
      return NextResponse.json(
        { error: `Quantities sum (${totalQuantity}) must equal original quantity (${existingLP.current_qty})` },
        { status: 400 }
      )
    }

    // Validate all quantities are positive
    if (quantities.some((qty: number) => qty <= 0)) {
      return NextResponse.json(
        { error: 'All quantities must be positive' },
        { status: 400 }
      )
    }

    // AC-5.5.1 & AC-5.5.2: Create new LPs with same product, location, batch_number, expiry_date
    const newLPs = []
    for (const quantity of quantities) {
      // Generate LP number using database function
      const { data: lpNumber } = await adminClient.rpc('generate_lp_number', {
        p_org_id: currentUser.org_id,
        p_warehouse_id: existingLP.warehouse_id,
      })

      const { data: newLP, error: createError } = await adminClient
        .from('license_plates')
        .insert({
          org_id: currentUser.org_id,
          lp_number: lpNumber || `LP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
          product_id: existingLP.product_id,
          quantity: quantity,
          current_qty: quantity,
          uom: existingLP.uom,
          status: 'available',
          qa_status: existingLP.qa_status,
          warehouse_id: existingLP.warehouse_id,
          location_id: existingLP.location_id,
          batch_number: existingLP.batch_number,
          supplier_batch_number: existingLP.supplier_batch_number,
          manufacturing_date: existingLP.manufacturing_date,
          expiry_date: existingLP.expiry_date,
          received_date: existingLP.received_date,
          created_by: session.user.id,
        })
        .select(`
          *,
          product:products (id, code, name, type, uom),
          location:locations (id, code, name),
          warehouse:warehouses (id, code, name)
        `)
        .single()

      if (createError) {
        throw new Error(`Failed to create new LP: ${createError.message}`)
      }

      newLPs.push(newLP)

      // AC-5.5.3: Create lp_genealogy record linking parent to child
      await adminClient.from('lp_genealogy').insert({
        org_id: currentUser.org_id,
        parent_lp_id: id,
        child_lp_id: newLP.id,
        relationship_type: 'split',
        quantity_from_parent: quantity,
        uom: existingLP.uom,
        created_by: session.user.id,
      })
    }

    // AC-5.5.4: Update original LP: set current_qty=0 and status='split'
    const { error: updateError } = await adminClient
      .from('license_plates')
      .update({
        current_qty: 0,
        status: 'split',
        updated_by: session.user.id,
      })
      .eq('id', id)

    if (updateError) {
      throw new Error(`Failed to update original LP: ${updateError.message}`)
    }

    // AC-5.5.7: Create lp_movements record with type='split'
    await adminClient.from('lp_movements').insert({
      org_id: currentUser.org_id,
      lp_id: id,
      movement_type: 'split',
      qty_change: -existingLP.current_qty,
      qty_before: existingLP.current_qty,
      qty_after: 0,
      uom: existingLP.uom,
      created_by_user_id: session.user.id,
      notes: `Split into ${quantities.length} LPs: ${quantities.join(', ')} ${existingLP.uom}`,
    })

    return NextResponse.json({
      data: newLPs,
      message: `Successfully split LP into ${quantities.length} new LPs`,
    })
  } catch (error) {
    console.error('Error in POST /api/warehouse/license-plates/[id]/split:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
