'use client'

import { useState, useEffect } from 'react'
import { PlanningStatsCard } from '@/components/planning/PlanningStatsCard'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import { PlanningActionButtons } from '@/components/planning/PlanningActionButtons'
import { TopPOCards } from '@/components/planning/TopPOCards'
import { TopTOCards } from '@/components/planning/TopTOCards'
import { TopWOCards } from '@/components/planning/TopWOCards'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { Loader2 } from 'lucide-react'

interface DashboardStats {
  purchase_orders: {
    total: number
    draft: number
    pending_approval: number
    confirmed: number
    close: number
    receiving_total: number
  }
  transfer_orders: {
    total: number
    in_transit: number
    pending_receipt: number
    completed: number
  }
  work_orders: {
    total: number
    active: number
    paused: number
    completed_today: number
    released: number
    total_today: number
  }
}

export default function PlanningDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/planning/dashboard/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        setStats(data.stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-destructive rounded-md bg-destructive/10">
        <p className="text-destructive font-medium">Error loading dashboard</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-4 border rounded-md">
        <p className="text-muted-foreground">No stats available</p>
      </div>
    )
  }

  return (
    <div>
      <PlanningHeader currentPage="dashboard" />

      <div className="px-6 py-6 space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold">Planning Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage purchase orders, transfer orders, and work orders</p>
        </div>

        {/* Create Buttons */}
        <PlanningActionButtons />

        {/* Main Layout Grid: Stats on left (3/4), Activity on right (1/4) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Cards (Left - 3/4 width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Cards Row - AC-3.24.5: Responsive 1/2/3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <PlanningStatsCard
                title="Purchase Orders"
                icon="📊"
                stats={stats.purchase_orders}
                type="po"
              />
              <PlanningStatsCard
                title="Transfer Orders"
                icon="📦"
                stats={stats.transfer_orders}
                type="to"
              />
              <PlanningStatsCard
                title="Work Orders"
                icon="🏭"
                stats={stats.work_orders}
                type="wo"
              />
            </div>

            {/* Recent PO Cards */}
            <TopPOCards />

            {/* Recent TO Cards */}
            <TopTOCards />

            {/* Recent WO Cards */}
            <TopWOCards />
          </div>

          {/* Activity Feed (Right - 1/4 width) */}
          <aside className="lg:col-span-1">
            <ActivityFeed limit={10} />
          </aside>
        </div>
      </div>
    </div>
  )
}
