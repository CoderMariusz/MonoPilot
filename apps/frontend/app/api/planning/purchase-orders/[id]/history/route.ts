// API Route: Purchase Order Status History
// Story 03.3: PO CRUD + Lines
// GET /api/planning/purchase-orders/:id/history - Get status change history

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { PurchaseOrderService } from '@/lib/services/purchase-order-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify PO exists and belongs to user's org
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, org_id')
      .eq('id', id)
      .single()

    if (poError || !po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Verify org isolation - return 404 not 403
    if (po.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Get status history
    const history = await PurchaseOrderService.getStatusHistory(id)

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/purchase-orders/:id/history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
