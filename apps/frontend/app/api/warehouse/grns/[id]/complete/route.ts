// API Route: GRN Complete
// Epic 5 Batch 5A-3 - Story 5.11: GRN + LP Creation
// POST /api/warehouse/grns/[id]/complete - Complete GRN
// Validates all items received, updates GRN status, ASN status, and PO status

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/warehouse/grns/[id]/complete - Complete GRN
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

    // Fetch GRN
    const { data: grn, error: grnError } = await supabaseAdmin
      .from('goods_receipt_notes')
      .select('id, grn_number, status, asn_id, po_id, org_id')
      .eq('id', grn_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (grnError || !grn) {
      return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
    }

    // Only allow completing for in_progress status
    if (grn.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Can only complete GRN in in_progress status' },
        { status: 400 }
      )
    }

    // Fetch all GRN items
    const { data: grnItems, error: itemsError } = await supabaseAdmin
      .from('grn_items')
      .select('id, expected_qty, received_qty, lp_id')
      .eq('grn_id', grn_id)
      .eq('org_id', currentUser.org_id)

    if (itemsError) {
      console.error('Error fetching GRN items:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    if (!grnItems || grnItems.length === 0) {
      return NextResponse.json({ error: 'No items found for this GRN' }, { status: 400 })
    }

    // Validate all items have been received (have lp_id)
    const unreceived = grnItems.filter((item) => !item.lp_id)
    if (unreceived.length > 0) {
      return NextResponse.json(
        { error: `${unreceived.length} items have not been received yet` },
        { status: 400 }
      )
    }

    // Story 5.13: Update PO line received_qty
    // Fetch GRN items with ASN item references to get po_line_id
    const { data: grnItemsWithASN, error: grnItemsAsnError } = await supabaseAdmin
      .from('grn_items')
      .select('id, received_qty, asn_item_id, asn_items(po_line_id)')
      .eq('grn_id', grn_id)

    if (grnItemsAsnError) {
      console.error('Error fetching GRN items with ASN:', grnItemsAsnError)
    }

    // Group received quantities by PO line
    const poLineUpdates = new Map<string, number>()
    for (const item of grnItemsWithASN || []) {
      const asnItem = item.asn_items as { po_line_id?: string } | null
      if (asnItem?.po_line_id) {
        const currentQty = poLineUpdates.get(asnItem.po_line_id) || 0
        poLineUpdates.set(asnItem.po_line_id, currentQty + (item.received_qty || 0))
      }
    }

    // Update PO lines received_qty (accumulate)
    for (const [poLineId, additionalReceivedQty] of poLineUpdates.entries()) {
      const { data: poLine } = await supabaseAdmin
        .from('po_lines')
        .select('received_qty')
        .eq('id', poLineId)
        .single()

      const newReceivedQty = (poLine?.received_qty || 0) + additionalReceivedQty

      await supabaseAdmin
        .from('po_lines')
        .update({ received_qty: newReceivedQty })
        .eq('id', poLineId)
    }

    // Update GRN status to 'completed'
    const { error: updateGRNError } = await supabaseAdmin
      .from('goods_receipt_notes')
      .update({
        status: 'completed',
        received_at: new Date().toISOString(),
      })
      .eq('id', grn_id)

    if (updateGRNError) {
      console.error('Error completing GRN:', updateGRNError)
      return NextResponse.json({ error: updateGRNError.message }, { status: 500 })
    }

    // Update ASN status to 'received' if this is the only/last GRN
    if (grn.asn_id) {
      // Check if all ASN items are fully received
      const { data: asnItems } = await supabaseAdmin
        .from('asn_items')
        .select('id, expected_qty, received_qty')
        .eq('asn_id', grn.asn_id)
        .eq('org_id', currentUser.org_id)

      const allReceived = asnItems?.every((item) => item.received_qty >= item.expected_qty)

      if (allReceived) {
        await supabaseAdmin.from('asn').update({ status: 'received' }).eq('id', grn.asn_id)
      }
    }

    // Story 5.13: Update PO status based on received quantities
    if (grn.po_id) {
      // Fetch all PO lines with fresh data (after updates above)
      const { data: poLines } = await supabaseAdmin
        .from('po_lines')
        .select('id, quantity, received_qty')
        .eq('po_id', grn.po_id)
        .eq('org_id', currentUser.org_id)

      if (poLines && poLines.length > 0) {
        // Check if all lines fully received
        const allLinesFullyReceived = poLines.every(
          (line) => (line.received_qty || 0) >= line.quantity
        )
        const anyLinePartiallyReceived = poLines.some(
          (line) => (line.received_qty || 0) > 0 && (line.received_qty || 0) < line.quantity
        )

        let newPOStatus = null
        if (allLinesFullyReceived) {
          newPOStatus = 'received'
        } else if (anyLinePartiallyReceived || poLines.some((line) => (line.received_qty || 0) > 0)) {
          newPOStatus = 'partially_received'
        }

        if (newPOStatus) {
          await supabaseAdmin
            .from('purchase_orders')
            .update({ status: newPOStatus })
            .eq('id', grn.po_id)
        }
      }
    }

    // Fetch updated GRN with details
    const { data: completedGRN } = await supabaseAdmin
      .from('goods_receipt_notes')
      .select(`
        *,
        asn!left(id, asn_number, status),
        purchase_orders!left(id, po_number, status),
        warehouses!inner(id, code, name),
        locations!left(id, code, name),
        grn_items(
          *,
          products!inner(id, code, name, uom),
          license_plates!left(
            id,
            lp_number,
            quantity,
            current_qty,
            status,
            qa_status
          )
        )
      `)
      .eq('id', grn_id)
      .single()

    return NextResponse.json({
      grn: completedGRN,
      message: 'GRN completed successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/warehouse/grns/[id]/complete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
