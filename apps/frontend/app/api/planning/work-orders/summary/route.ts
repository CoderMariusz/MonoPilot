/**
 * API Route: /api/planning/work-orders/summary
 * Story 03.10: Work Order CRUD - KPI Summary
 * Returns counts for KPI cards on work order list page
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // Get current user's org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    const orgId = currentUser.org_id
    const today = new Date().toISOString().split('T')[0]

    // Get start of week (Monday)
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    const weekStart = monday.toISOString().split('T')[0]

    // Query counts in parallel
    const [
      scheduledTodayResult,
      inProgressResult,
      onHoldResult,
      thisWeekResult,
    ] = await Promise.all([
      // Scheduled Today: planned_start_date = today AND status IN (planned, released)
      supabase
        .from('work_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('planned_start_date', today)
        .in('status', ['planned', 'released']),

      // In Progress
      supabase
        .from('work_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'in_progress'),

      // On Hold
      supabase
        .from('work_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'on_hold'),

      // This Week: created_at >= start of week
      supabase
        .from('work_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', weekStart),
    ])

    return NextResponse.json({
      success: true,
      data: {
        scheduled_today_count: scheduledTodayResult.count || 0,
        in_progress_count: inProgressResult.count || 0,
        on_hold_count: onHoldResult.count || 0,
        this_week_count: thisWeekResult.count || 0,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/planning/work-orders/summary:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
