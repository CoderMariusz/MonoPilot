import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { PlanningStatsCard } from '@/components/planning/PlanningStatsCard'
import { PlanningQuickActions } from '@/components/planning/PlanningQuickActions'

interface Stats {
  purchase_orders: {
    total: number
    by_status: Record<string, number>
    pending_approval: number
  }
  transfer_orders: {
    total: number
    by_status: Record<string, number>
  }
  work_orders: {
    total: number
    by_status: Record<string, number>
    completed_today: number
  }
}

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

async function fetchPlanningStats(orgId: string): Promise<Stats> {
  const supabaseAdmin = createServerSupabaseAdmin()

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

  return {
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
  }
}

export default async function PlanningDashboardPage() {
  const supabase = await createServerSupabase()

  // Authentication is handled by parent layout
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get current user to check org_id
  const { data: currentUser } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', session!.user.id)
    .single()

  // Fetch stats
  const stats = await fetchPlanningStats(currentUser!.org_id)

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planning Module</h2>
          <p className="text-muted-foreground">
            Manage purchase orders, transfer orders, and work orders
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Quick Actions
          </h3>
          <PlanningQuickActions />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Purchase Orders Card */}
          <PlanningStatsCard
            icon="📊"
            title="Purchase Orders"
            accentColor="blue"
            stats={[
              { label: 'Total', value: stats.purchase_orders.total },
              {
                label: 'Draft',
                value: stats.purchase_orders.by_status['draft'] || 0,
                color: 'default',
              },
              {
                label: 'Pending Approval',
                value: stats.purchase_orders.pending_approval,
                color: 'yellow',
              },
              {
                label: 'Confirmed',
                value: stats.purchase_orders.by_status['confirmed'] || 0,
                color: 'green',
              },
            ]}
          />

          {/* Transfer Orders Card */}
          <PlanningStatsCard
            icon="📦"
            title="Transfer Orders"
            accentColor="orange"
            stats={[
              { label: 'Total', value: stats.transfer_orders.total },
              {
                label: 'In Transit',
                value: stats.transfer_orders.by_status['in_transit'] || 0,
                color: 'blue',
              },
              {
                label: 'Pending Receipt',
                value: stats.transfer_orders.by_status['pending'] || 0,
                color: 'yellow',
              },
              {
                label: 'Completed',
                value: stats.transfer_orders.by_status['completed'] || 0,
                color: 'green',
              },
            ]}
          />

          {/* Work Orders Card */}
          <PlanningStatsCard
            icon="🏭"
            title="Work Orders"
            accentColor="green"
            stats={[
              { label: 'Total', value: stats.work_orders.total },
              {
                label: 'Active',
                value: stats.work_orders.by_status['active'] || 0,
                color: 'blue',
              },
              {
                label: 'Paused',
                value: stats.work_orders.by_status['paused'] || 0,
                color: 'yellow',
              },
              {
                label: 'Completed Today',
                value: stats.work_orders.completed_today,
                color: 'green',
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
