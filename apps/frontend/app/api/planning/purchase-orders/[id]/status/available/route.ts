/**
 * API Route: Available Status Transitions
 * Story: 03.7 - PO Status Lifecycle (Configurable Statuses)
 *
 * GET /api/planning/purchase-orders/:id/status/available - Get available transitions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { POStatusService } from '@/lib/services/po-status-service'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/planning/purchase-orders/:id/status/available
 * Get available status transitions for a PO
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

    // Get available transitions
    const availableStatuses = await POStatusService.getAvailableTransitions(
      id,
      userData.org_id
    )

    return NextResponse.json({
      available_statuses: availableStatuses,
      total: availableStatuses.length,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/purchase-orders/:id/status/available:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
