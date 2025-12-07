// API Route: License Plate Move
// Epic 5 Batch 05B-1: Stock Moves (Story 5.14)
// POST /api/warehouse/license-plates/[id]/move - Move LP to new location

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

    // AC-5.14.1: Authorization - warehouse, manager, admin
    if (!['warehouse', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse role or higher required' },
        { status: 403 }
      )
    }

    // Parse body
    const body = await request.json()
    const { to_location_id, notes } = body

    if (!to_location_id) {
      return NextResponse.json(
        { error: 'Missing required field: to_location_id' },
        { status: 400 }
      )
    }

    // Get LP
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('*, location:locations!location_id(id, code, name, is_active)')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (lpError || !lp) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    // AC-5.17.1: Validate destination location exists and is active
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

    // AC-5.17.2: Optional - check location type compatibility
    // For now we allow all types, can add restrictions later based on product type

    const fromLocationId = lp.location_id

    if (fromLocationId === to_location_id) {
      return NextResponse.json(
        { error: 'Destination location must be different from current location' },
        { status: 400 }
      )
    }

    // AC-5.14.2: Update LP location
    const { error: updateError } = await adminClient
      .from('license_plates')
      .update({
        location_id: to_location_id,
        warehouse_id: toLocation.warehouse_id,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      throw new Error(`Failed to update LP location: ${updateError.message}`)
    }

    // AC-5.14.3: Create movement record
    const { error: movementError } = await adminClient.from('lp_movements').insert({
      org_id: currentUser.org_id,
      lp_id: id,
      movement_type: 'transfer',
      qty_change: 0, // No quantity change in transfer
      qty_before: lp.current_qty,
      qty_after: lp.current_qty,
      uom: lp.uom,
      from_location_id: fromLocationId,
      to_location_id: to_location_id,
      created_by_user_id: session.user.id,
      notes: notes || null,
    })

    if (movementError) {
      throw new Error(`Failed to create movement record: ${movementError.message}`)
    }

    // Return updated LP with location details
    const { data: updatedLP } = await supabase
      .from('license_plates')
      .select(`
        *,
        product:products(id, code, name, type, uom),
        location:locations!location_id(id, code, name, type, warehouse_id),
        warehouse:warehouses(id, code, name)
      `)
      .eq('id', id)
      .single()

    return NextResponse.json({
      data: updatedLP,
      message: `Successfully moved LP to ${toLocation.code}`,
    })
  } catch (error) {
    console.error('Error in POST /api/warehouse/license-plates/[id]/move:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
