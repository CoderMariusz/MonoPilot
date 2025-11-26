'use client'

import { useState, useEffect } from 'react'
import { PlanningStatsCard } from '@/components/planning/PlanningStatsCard'
import { PlanningQuickActions } from '@/components/planning/PlanningQuickActions'
import { Loader2 } from 'lucide-react'

interface DashboardStats {
  purchase_orders: {
    total: number
    draft: number
    pending_approval: number
    confirmed: number
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planning Module</h1>
        <p className="text-muted-foreground">Manage purchase orders, transfer orders, and work orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PlanningStatsCard
          title="Purchase Orders"
          icon="📊"
          stats={stats.purchase_orders}
        />
        <PlanningStatsCard
          title="Transfer Orders"
          icon="📦"
          stats={stats.transfer_orders}
        />
        <PlanningStatsCard
          title="Work Orders"
          icon="🏭"
          stats={stats.work_orders}
        />
      </div>

      <PlanningQuickActions />
    </div>
  )
}
