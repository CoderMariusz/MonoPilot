// API Route: PO Receiving Status
// Epic 5 Batch 5A-3 - Story 5.13: Update PO/TO Quantities
// GET /api/planning/purchase-orders/[id]/receiving-status

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET - Get receiving progress for PO
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
    const { id: po_id } = await context.params

    // Fetch PO
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, po_number, status, org_id')
      .eq('id', po_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (poError || !po) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 })
    }

    // Fetch PO lines
    const { data: poLines, error: linesError } = await supabaseAdmin
      .from('po_lines')
      .select('id, sequence, product_id, quantity, received_qty, uom, products(code, name)')
      .eq('po_id', po_id)
      .eq('org_id', currentUser.org_id)
      .order('sequence')

    if (linesError) {
      return NextResponse.json({ error: linesError.message }, { status: 500 })
    }

    // Calculate receiving statistics
    const totalLines = poLines?.length || 0
    const fullyReceivedLines = poLines?.filter((line) => (line.received_qty || 0) >= line.quantity).length || 0
    const partiallyReceivedLines = poLines?.filter(
      (line) => (line.received_qty || 0) > 0 && (line.received_qty || 0) < line.quantity
    ).length || 0
    const pendingLines = poLines?.filter((line) => (line.received_qty || 0) === 0).length || 0

    const totalQty = poLines?.reduce((sum, line) => sum + line.quantity, 0) || 0
    const totalReceived = poLines?.reduce((sum, line) => sum + (line.received_qty || 0), 0) || 0

    const receivedPercent = totalQty > 0 ? (totalReceived / totalQty) * 100 : 0

    return NextResponse.json({
      po_id,
      po_number: po.po_number,
      status: po.status,
      lines: {
        total: totalLines,
        fully_received: fullyReceivedLines,
        partially_received: partiallyReceivedLines,
        pending: pendingLines,
      },
      quantities: {
        total: totalQty,
        received: totalReceived,
        pending: totalQty - totalReceived,
      },
      received_percent: Math.round(receivedPercent * 100) / 100,
      line_details: poLines?.map((line) => ({
        line_id: line.id,
        sequence: line.sequence,
        product_id: line.product_id,
        product_code: (line.products as { code?: string; name?: string } | null)?.code,
        product_name: (line.products as { code?: string; name?: string } | null)?.name,
        quantity: line.quantity,
        received_qty: line.received_qty || 0,
        pending_qty: line.quantity - (line.received_qty || 0),
        uom: line.uom,
        percent_received: line.quantity > 0 ? Math.round(((line.received_qty || 0) / line.quantity) * 10000) / 100 : 0,
      })),
    })
  } catch (error) {
    console.error('Error in GET /api/planning/purchase-orders/[id]/receiving-status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
