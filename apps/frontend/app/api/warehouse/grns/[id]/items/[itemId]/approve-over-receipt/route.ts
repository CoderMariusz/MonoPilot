// API Route: Approve Over-Receipt for GRN Item
// Epic 5 Batch 5A-3 - Story 5.10: Over-Receipt Handling
// POST /api/warehouse/grns/[id]/items/[itemId]/approve-over-receipt

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>
}

// POST - Approve over-receipt (Manager/Admin only)
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

    // Authorization: Manager or Admin ONLY
    if (!['manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Manager or Admin role required to approve over-receipt' },
        { status: 403 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()
    const { id: grn_id, itemId: grn_item_id } = await context.params

    // Fetch GRN item
    const { data: grnItem, error: grnItemError } = await supabaseAdmin
      .from('grn_items')
      .select('id, grn_id, is_over_receipt, approved_by, expected_qty, received_qty')
      .eq('id', grn_item_id)
      .eq('grn_id', grn_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (grnItemError || !grnItem) {
      return NextResponse.json({ error: 'GRN item not found' }, { status: 404 })
    }

    // Check if it's actually an over-receipt
    if (!grnItem.is_over_receipt) {
      return NextResponse.json({ error: 'Item is not an over-receipt' }, { status: 400 })
    }

    // Check if already approved
    if (grnItem.approved_by) {
      return NextResponse.json({ error: 'Over-receipt already approved' }, { status: 400 })
    }

    // Approve the over-receipt
    const { error: updateError } = await supabaseAdmin
      .from('grn_items')
      .update({
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', grn_item_id)

    if (updateError) {
      console.error('Error approving over-receipt:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: 'Over-receipt approved successfully',
        grn_item_id,
        approved_by: session.user.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/grns/[id]/items/[itemId]/approve-over-receipt:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
