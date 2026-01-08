/**
 * API Route: Get Yield History
 * Story: 04.4 - Yield Tracking
 * GET /api/production/work-orders/:id/yield/history
 *
 * Returns yield update history for a work order.
 * Includes summary with total updates, timestamps, and current yield.
 *
 * Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-014)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { YieldService } from '@/lib/services/yield-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Not logged in' },
        { status: 401 }
      )
    }

    // Get current user with org
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify WO exists and belongs to user's org
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, org_id, yield_percent')
      .eq('id', woId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (woError || !wo) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Work order not found' },
        { status: 404 }
      )
    }

    // Get yield history
    const logs = await YieldService.getYieldHistory(supabase, woId)

    // Build summary
    const summary = {
      total_updates: logs.length,
      first_update: logs.length > 0 ? logs[logs.length - 1].created_at : null,
      last_update: logs.length > 0 ? logs[0].created_at : null,
      current_yield: wo.yield_percent || 0,
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          logs,
          summary,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/production/work-orders/:id/yield/history:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch yield history.' },
      { status: 500 }
    )
  }
}
