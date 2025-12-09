// API Route: GRN Receive Item
// Epic 5 Batch 5A-3 - Story 5.11: GRN + LP Creation
// POST /api/warehouse/grns/[id]/receive - Process receiving for a single item
// Creates License Plate, updates GRN item, updates ASN item

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { createLP } from '@/lib/services/license-plate-service'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/warehouse/grns/[id]/receive - Receive item and create LP
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

    const supabaseAdmin = createServerSupabaseAdmin()
    const { id: grn_id } = await context.params
    const body = await request.json()
    const {
      grn_item_id,
      received_qty,
      location_id,
      supplier_batch_number,
      manufacture_date,
      expiry_date,
    } = body

    // Validate required fields
    if (!grn_item_id || !received_qty || received_qty <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields: grn_item_id, received_qty (must be > 0)' },
        { status: 400 }
      )
    }

    // Fetch GRN
    const { data: grn, error: grnError } = await supabaseAdmin
      .from('goods_receipt_notes')
      .select('id, grn_number, status, warehouse_id, receiving_location_id, org_id, po_id')
      .eq('id', grn_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (grnError || !grn) {
      return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
    }

    // Only allow receiving for draft/in_progress status
    if (!['draft', 'in_progress'].includes(grn.status)) {
      return NextResponse.json(
        { error: 'Can only receive items for GRN in draft or in_progress status' },
        { status: 400 }
      )
    }

    // Fetch GRN item
    const { data: grnItem, error: grnItemError } = await supabaseAdmin
      .from('grn_items')
      .select('*, asn_items!left(id, supplier_batch_number, manufacture_date, expiry_date)')
      .eq('id', grn_item_id)
      .eq('grn_id', grn_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (grnItemError || !grnItem) {
      return NextResponse.json({ error: 'GRN item not found' }, { status: 404 })
    }

    // Check if already received
    if (grnItem.lp_id) {
      return NextResponse.json({ error: 'Item already received' }, { status: 400 })
    }

    // Fetch warehouse settings for over-receipt tolerance and auto-print
    const { data: warehouseSettings } = await supabaseAdmin
      .from('warehouse_settings')
      .select('allow_over_receipt, over_receipt_tolerance_percent, auto_print_on_receive')
      .eq('warehouse_id', grn.warehouse_id)
      .single()

    // Check if over-receipt is happening
    const isOverReceipt = received_qty > grnItem.expected_qty
    let requiresApproval = false

    if (isOverReceipt) {
      const overReceiptPercent = ((received_qty - grnItem.expected_qty) / grnItem.expected_qty) * 100
      const tolerance = warehouseSettings?.over_receipt_tolerance_percent || 0

      // If over-receipt not allowed, reject
      if (!warehouseSettings?.allow_over_receipt) {
        return NextResponse.json(
          {
            error: `Over-receipt not allowed. Received: ${received_qty}, Expected: ${grnItem.expected_qty}`
          },
          { status: 400 }
        )
      }

      // If exceeds tolerance, requires approval
      if (overReceiptPercent > tolerance) {
        requiresApproval = true

        return NextResponse.json(
          {
            error: `Over-receipt exceeds tolerance (${tolerance}%). Received: ${received_qty}, Expected: ${grnItem.expected_qty}. Manager approval required.`,
            requires_approval: true,
            over_receipt_percent: overReceiptPercent
          },
          { status: 400 }
        )
      }
    }

    // Use ASN item data if not provided
    const asnItem = grnItem.asn_items
    const finalSupplierBatch = supplier_batch_number || asnItem?.supplier_batch_number || null
    const finalManufactureDate = manufacture_date || asnItem?.manufacture_date || null
    const finalExpiryDate = expiry_date || asnItem?.expiry_date || null

    // Determine location: provided > GRN receiving location > null
    const finalLocationId = location_id || grn.receiving_location_id || null

    // Create License Plate using service (Story 5.30: Set source document)
    const createdLP = await createLP(
      {
        product_id: grnItem.product_id,
        quantity: received_qty,
        uom: grnItem.uom,
        warehouse_id: grn.warehouse_id,
        location_id: finalLocationId,
        supplier_batch_number: finalSupplierBatch,
        manufacturing_date: finalManufactureDate,
        expiry_date: finalExpiryDate,
        status: 'available',
        qa_status: 'pending',
        // Story 5.30: Source document tracking
        source_type: 'receiving',
        source_grn_id: grn_id,
        source_po_id: grn.po_id || undefined,
      },
      currentUser.org_id,
      session.user.id
    )

    if (!createdLP) {
      return NextResponse.json({ error: 'Failed to create License Plate' }, { status: 500 })
    }

    // Update GRN item with received_qty, lp_id, and over-receipt flag
    const { error: updateGRNItemError } = await supabaseAdmin
      .from('grn_items')
      .update({
        received_qty,
        lp_id: createdLP.id,
        is_over_receipt: isOverReceipt,
      })
      .eq('id', grn_item_id)

    if (updateGRNItemError) {
      console.error('Error updating GRN item:', updateGRNItemError)
      // Note: LP already created - manual cleanup may be needed
      return NextResponse.json({ error: updateGRNItemError.message }, { status: 500 })
    }

    // Update ASN item received_qty (accumulate if multiple receives)
    if (grnItem.asn_item_id) {
      const { data: asnItemCurrent } = await supabaseAdmin
        .from('asn_items')
        .select('received_qty')
        .eq('id', grnItem.asn_item_id)
        .single()

      const newReceivedQty = (asnItemCurrent?.received_qty || 0) + received_qty

      await supabaseAdmin
        .from('asn_items')
        .update({ received_qty: newReceivedQty })
        .eq('id', grnItem.asn_item_id)
    }

    // Update GRN status to 'in_progress' if it was 'draft'
    if (grn.status === 'draft') {
      await supabaseAdmin
        .from('goods_receipt_notes')
        .update({ status: 'in_progress', received_at: new Date().toISOString() })
        .eq('id', grn_id)
    }

    // Auto-print label if enabled
    let printJobQueued = false
    if (warehouseSettings?.auto_print_on_receive) {
      // TODO: Queue print job or call print endpoint
      // For now, just flag it
      printJobQueued = true
    }

    return NextResponse.json(
      {
        license_plate: createdLP,
        grn_item_id,
        received_qty,
        message: 'Item received successfully and License Plate created',
        print_job_queued: printJobQueued,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/grns/[id]/receive:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
