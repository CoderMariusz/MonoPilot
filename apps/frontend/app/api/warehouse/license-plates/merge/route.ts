// API Route: Merge License Plates
// Epic 5 Batch 05A-2: LP Operations (Story 5.6)
// POST /api/warehouse/license-plates/merge - Merge multiple LPs into one

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { LicensePlate } from '@/lib/services/license-plate-service'

interface MergeLPRequest {
  lp_ids: string[]
}

// POST /api/warehouse/license-plates/merge - Merge multiple LPs
export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body: MergeLPRequest = await request.json()

    // Validation: Must have at least 2 LPs
    if (!body.lp_ids || !Array.isArray(body.lp_ids) || body.lp_ids.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 license plates required for merge' },
        { status: 400 }
      )
    }

    // AC-5.6.1: Fetch all LPs to merge
    const { data: sourceLPs, error: fetchError } = await adminClient
      .from('license_plates')
      .select(`
        id,
        org_id,
        lp_number,
        product_id,
        current_qty,
        quantity,
        uom,
        status,
        qa_status,
        location_id,
        warehouse_id,
        batch_number,
        supplier_batch_number,
        manufacturing_date,
        expiry_date,
        received_date
      `)
      .in('id', body.lp_ids)
      .eq('org_id', currentUser.org_id)

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch LPs: ${fetchError.message}` },
        { status: 500 }
      )
    }

    if (!sourceLPs || sourceLPs.length !== body.lp_ids.length) {
      return NextResponse.json(
        { error: 'One or more LPs not found' },
        { status: 404 }
      )
    }

    // AC-5.6.2: Validate all LPs have same product
    const firstProduct = sourceLPs[0].product_id
    if (!sourceLPs.every(lp => lp.product_id === firstProduct)) {
      return NextResponse.json(
        { error: 'All license plates must have the same product' },
        { status: 400 }
      )
    }

    // Validate all LPs have same location
    const firstLocation = sourceLPs[0].location_id
    if (!sourceLPs.every(lp => lp.location_id === firstLocation)) {
      return NextResponse.json(
        { error: 'All license plates must be in the same location' },
        { status: 400 }
      )
    }

    // AC-5.6.4: Validate all LPs are available
    if (!sourceLPs.every(lp => lp.status === 'available')) {
      return NextResponse.json(
        { error: 'All license plates must have status "available"' },
        { status: 400 }
      )
    }

    // AC-5.6.1: Calculate merged quantity
    const totalQuantity = sourceLPs.reduce((sum, lp) => sum + lp.current_qty, 0)

    // AC-5.6.3: Use earliest expiry date
    const expiryDates = sourceLPs
      .map(lp => lp.expiry_date)
      .filter((date): date is string => date !== null && date !== undefined)

    const earliestExpiry = expiryDates.length > 0
      ? expiryDates.sort()[0]
      : null

    // Generate LP number for merged LP
    const { data: lpNumber, error: seqError } = await adminClient.rpc('generate_lp_number', {
      p_org_id: currentUser.org_id,
      p_warehouse_id: sourceLPs[0].warehouse_id,
    })

    if (seqError) {
      console.warn('LP number generation failed, using fallback')
    }

    // AC-5.6.1: Create merged LP
    const { data: mergedLP, error: createError } = await adminClient
      .from('license_plates')
      .insert({
        org_id: currentUser.org_id,
        lp_number: lpNumber || `LP-${Date.now().toString(36).toUpperCase()}`,
        product_id: firstProduct,
        quantity: totalQuantity,
        current_qty: totalQuantity,
        uom: sourceLPs[0].uom,
        status: 'available',
        qa_status: sourceLPs[0].qa_status || 'pending',
        warehouse_id: sourceLPs[0].warehouse_id,
        location_id: firstLocation,
        batch_number: sourceLPs[0].batch_number,
        supplier_batch_number: sourceLPs[0].supplier_batch_number,
        manufacturing_date: sourceLPs[0].manufacturing_date,
        expiry_date: earliestExpiry,
        received_date: new Date().toISOString().split('T')[0],
        created_by: session.user.id,
      })
      .select(`
        *,
        product:products (id, code, name, type, uom),
        location:locations (id, code, name),
        warehouse:warehouses (id, code, name)
      `)
      .single()

    if (createError || !mergedLP) {
      return NextResponse.json(
        { error: `Failed to create merged LP: ${createError?.message}` },
        { status: 500 }
      )
    }

    // AC-5.6.5: Update source LPs status to 'merged' and current_qty to 0
    const { error: updateError } = await adminClient
      .from('license_plates')
      .update({
        status: 'merged',
        current_qty: 0,
        updated_by: session.user.id,
      })
      .in('id', body.lp_ids)

    if (updateError) {
      console.error('Failed to update source LPs:', updateError)
      // Continue - merged LP already created
    }

    // AC-5.6.4: Create genealogy records (source LPs as parents, merged LP as child)
    const genealogyRecords = sourceLPs.map(sourceLp => ({
      org_id: currentUser.org_id,
      parent_lp_id: sourceLp.id,
      child_lp_id: mergedLP.id,
      relationship_type: 'combine',
      quantity_from_parent: sourceLp.current_qty,
      uom: sourceLp.uom,
      created_by: session.user.id,
    }))

    const { error: genealogyError } = await adminClient
      .from('lp_genealogy')
      .insert(genealogyRecords)

    if (genealogyError) {
      console.error('Failed to create genealogy records:', genealogyError)
      // Continue - merged LP already created
    }

    // Create movement records for audit trail
    const movementRecords = [
      // Movement for merged LP (creation)
      {
        org_id: currentUser.org_id,
        lp_id: mergedLP.id,
        movement_type: 'merge',
        qty_change: totalQuantity,
        qty_before: 0,
        qty_after: totalQuantity,
        uom: mergedLP.uom,
        created_by_user_id: session.user.id,
        notes: `Merged from ${sourceLPs.length} LPs: ${sourceLPs.map(lp => lp.lp_number).join(', ')}`,
      },
      // Movements for source LPs (depletion)
      ...sourceLPs.map(sourceLp => ({
        org_id: currentUser.org_id,
        lp_id: sourceLp.id,
        movement_type: 'merge',
        qty_change: -sourceLp.current_qty,
        qty_before: sourceLp.current_qty,
        qty_after: 0,
        uom: sourceLp.uom,
        created_by_user_id: session.user.id,
        notes: `Merged into LP ${mergedLP.lp_number}`,
      })),
    ]

    const { error: movementError } = await adminClient
      .from('lp_movements')
      .insert(movementRecords)

    if (movementError) {
      console.error('Failed to create movement records:', movementError)
      // Continue - merged LP already created
    }

    return NextResponse.json(
      {
        data: mergedLP,
        message: `Successfully merged ${sourceLPs.length} LPs into ${mergedLP.lp_number}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/license-plates/merge:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
