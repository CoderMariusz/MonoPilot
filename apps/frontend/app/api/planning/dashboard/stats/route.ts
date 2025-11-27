// API Route: Planning Dashboard Stats
// GET /api/planning/dashboard/stats - Fetch aggregated stats for PO, TO, WO

import { NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

interface PORow {
  status: string | null
  approval_status: string | null
}

interface TORow {
  status: string | null
}

interface WORow {
  status: string | null
  completed_at: string | null
}

export async function GET() {
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
    const orgId = currentUser.org_id

    // Fetch all stats in parallel
    const [poStats, toStats, woStats] = await Promise.all([
      // Purchase Orders stats
      supabaseAdmin
        .from('purchase_orders')
        .select('status, approval_status')
        .eq('org_id', orgId),

      // Transfer Orders stats
      supabaseAdmin
        .from('transfer_orders')
        .select('status')
        .eq('org_id', orgId),

      // Work Orders stats
      supabaseAdmin
        .from('work_orders')
        .select('status, completed_at')
        .eq('org_id', orgId),
    ])

    // Process PO stats
    const poData = (poStats.data || []) as PORow[]
    const poByStatus: Record<string, number> = {}
    let poPendingApproval = 0

    poData.forEach((po: PORow) => {
      const status = po.status || 'unknown'
      poByStatus[status] = (poByStatus[status] || 0) + 1
      if (po.approval_status === 'pending') {
        poPendingApproval++
      }
    })

    // Process TO stats
    const toData = (toStats.data || []) as TORow[]
    const toByStatus: Record<string, number> = {}

    toData.forEach((to: TORow) => {
      const status = to.status || 'unknown'
      toByStatus[status] = (toByStatus[status] || 0) + 1
    })

    // Process WO stats
    const woData = (woStats.data || []) as WORow[]
    const woByStatus: Record<string, number> = {}
    let woCompletedToday = 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    woData.forEach((wo: WORow) => {
      const status = wo.status || 'unknown'
      woByStatus[status] = (woByStatus[status] || 0) + 1

      // Check if completed today
      if (wo.completed_at) {
        const completedDate = new Date(wo.completed_at)
        completedDate.setHours(0, 0, 0, 0)
        if (completedDate.getTime() === today.getTime()) {
          woCompletedToday++
        }
      }
    })

    return NextResponse.json({
      stats: {
        purchase_orders: {
          total: poData.length,
          by_status: poByStatus,
          pending_approval: poPendingApproval,
        },
        transfer_orders: {
          total: toData.length,
          by_status: toByStatus,
        },
        work_orders: {
          total: woData.length,
          by_status: woByStatus,
          completed_today: woCompletedToday,
        },
      },
    })
  } catch (error) {
    console.error('Error in GET /api/planning/dashboard/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
