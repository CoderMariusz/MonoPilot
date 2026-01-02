/**
 * API Route: PO Status History
 * Story: 03.7 - PO Status Lifecycle (Configurable Statuses)
 *
 * GET /api/planning/purchase-orders/:id/status/history - Get status history
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { POStatusService } from '@/lib/services/po-status-service'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/planning/purchase-orders/:id/status/history
 * Get status change history for a PO
 *
 * Auth: Planner or above
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's org
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 403 }
      )
    }

    // Check if PO exists
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('id')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (!po) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Get status history
    const history = await POStatusService.getStatusHistory(
      id,
      userData.org_id
    )

    // Transform history for API response
    const historyResponse = history.map((entry) => ({
      id: entry.id,
      po_id: entry.po_id,
      from_status: entry.from_status,
      to_status: entry.to_status,
      changed_by: entry.changed_by,
      changed_by_name: entry.user
        ? `${entry.user.first_name || ''} ${entry.user.last_name || ''}`.trim() || null
        : null,
      changed_at: entry.changed_at,
      notes: entry.notes,
      is_system: entry.changed_by === null,
    }))

    return NextResponse.json({
      history: historyResponse,
      total: historyResponse.length,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/purchase-orders/:id/status/history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
