'use client'

import { useState, useEffect } from 'react'
import { PlanningStatsCard } from '@/components/planning/PlanningStatsCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
    <div className="p-8">
      <div className="space-y-6">
        {/* Page Header with View Toggle */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Planning Module</h1>
            <p className="text-muted-foreground">Manage purchase orders, transfer orders, and work orders</p>
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0">
            {/* View Toggle Buttons */}
            <div className="flex rounded-lg border overflow-hidden">
              <Button variant="secondary" size="sm" className="rounded-none bg-blue-100">
                Dashboard
              </Button>
              <Link href="/planning/purchase-orders">
                <Button variant="ghost" size="sm" className="rounded-none">
                  Purchase Orders
                </Button>
              </Link>
              <Link href="/planning/transfer-orders">
                <Button variant="ghost" size="sm" className="rounded-none">
                  Transfer Orders
                </Button>
              </Link>
              <Link href="/planning/work-orders">
                <Button variant="ghost" size="sm" className="rounded-none">
                  Work Orders
                </Button>
              </Link>
              <Link href="/planning/suppliers">
                <Button variant="ghost" size="sm" className="rounded-none">
                  Suppliers
                </Button>
              </Link>
            </div>

            {/* Settings Button */}
            <Link href="/settings/planning">
              <Button variant="outline" size="sm">
                ⚙️ Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Create Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/planning/purchase-orders/new">
              ➕ Create PO
            </Link>
          </Button>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/planning/transfer-orders/new">
              ➕ Create TO
            </Link>
          </Button>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/planning/work-orders/new">
              ➕ Create WO
            </Link>
          </Button>
        </div>

        {/* Main Layout Grid: Stats on left (3/4), Activity on right (1/4) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Cards (Left - 3/4 width) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
