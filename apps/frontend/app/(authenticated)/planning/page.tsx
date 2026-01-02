/**
 * Planning Dashboard Page
 * Story: 03.16 - Planning Dashboard
 *
 * Main dashboard page displaying:
 * - Page header with title "Planning Dashboard"
 * - 6 KPI cards (responsive grid: 1 col mobile, 2 col tablet, 3 col desktop)
 * - Alert panel with severity indicators
 * - Activity feed (last 20 items)
 * - Quick actions (Create PO, Create TO, Create WO)
 * - All sections with loading/error/empty states
 *
 * Route: /planning
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import { KPICardsGrid, KPIType } from '@/components/planning/dashboard/KPICard'
import { AlertPanel } from '@/components/planning/dashboard/AlertPanel'
import { ActivityFeed } from '@/components/planning/dashboard/ActivityFeed'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus,
  ShoppingCart,
  Truck,
  Factory,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import type { KPIData, Alert, Activity } from '@/lib/types/planning-dashboard'

// Dashboard data state
interface DashboardData {
  kpis: KPIData | null
  alerts: Alert[]
  activities: Activity[]
}

// Loading state for each section
interface LoadingState {
  kpis: boolean
  alerts: boolean
  activities: boolean
}

// Error state for each section
interface ErrorState {
  kpis: string | null
  alerts: string | null
  activities: string | null
}

export default function PlanningDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData>({
    kpis: null,
    alerts: [],
    activities: [],
  })
  const [loading, setLoading] = useState<LoadingState>({
    kpis: true,
    alerts: true,
    activities: true,
  })
  const [error, setError] = useState<ErrorState>({
    kpis: null,
    alerts: null,
    activities: null,
  })

  // Fetch KPIs
  const fetchKPIs = useCallback(async () => {
    setLoading((prev) => ({ ...prev, kpis: true }))
    setError((prev) => ({ ...prev, kpis: null }))
    try {
      const response = await fetch('/api/planning/dashboard/kpis')
      if (!response.ok) {
        throw new Error('Failed to fetch KPIs')
      }
      const result = await response.json()
      setData((prev) => ({ ...prev, kpis: result.data || result }))
    } catch (err) {
      setError((prev) => ({
        ...prev,
        kpis: err instanceof Error ? err.message : 'Unknown error',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, kpis: false }))
    }
  }, [])

  // Fetch Alerts
  const fetchAlerts = useCallback(async () => {
    setLoading((prev) => ({ ...prev, alerts: true }))
    setError((prev) => ({ ...prev, alerts: null }))
    try {
      const response = await fetch('/api/planning/dashboard/alerts?limit=10')
      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }
      const result = await response.json()
      setData((prev) => ({ ...prev, alerts: result.alerts || [] }))
    } catch (err) {
      setError((prev) => ({
        ...prev,
        alerts: err instanceof Error ? err.message : 'Unknown error',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, alerts: false }))
    }
  }, [])

  // Fetch Activities
  const fetchActivities = useCallback(async () => {
    setLoading((prev) => ({ ...prev, activities: true }))
    setError((prev) => ({ ...prev, activities: null }))
    try {
      const response = await fetch('/api/planning/dashboard/activity?limit=20')
      if (!response.ok) {
        throw new Error('Failed to fetch activity')
      }
      const result = await response.json()
      setData((prev) => ({ ...prev, activities: result.activities || [] }))
    } catch (err) {
      setError((prev) => ({
        ...prev,
        activities: err instanceof Error ? err.message : 'Unknown error',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, activities: false }))
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchKPIs()
    fetchAlerts()
    fetchActivities()

    // Auto-refresh every 2 minutes (cache TTL)
    const interval = setInterval(() => {
      fetchKPIs()
      fetchAlerts()
      fetchActivities()
    }, 120000)

    return () => clearInterval(interval)
  }, [fetchKPIs, fetchAlerts, fetchActivities])

  // Handle KPI card click - navigate to filtered list
  const handleKPICardClick = (type: KPIType) => {
    const routes: Record<KPIType, string> = {
      po_pending_approval: '/planning/purchase-orders?approval_status=pending',
      po_this_month: '/planning/purchase-orders?created_this_month=true',
      to_in_transit: '/planning/transfer-orders?status=in_transit',
      wo_scheduled_today: '/planning/work-orders?scheduled_date=today',
      wo_overdue: '/planning/work-orders?overdue=true',
      open_orders: '/planning/purchase-orders?status=open',
    }
    router.push(routes[type])
  }

  // Handle alert click - navigate to entity detail
  const handleAlertClick = (alert: Alert) => {
    const routes: Record<string, string> = {
      purchase_order: `/planning/purchase-orders/${alert.entity_id}`,
      transfer_order: `/planning/transfer-orders/${alert.entity_id}`,
      work_order: `/planning/work-orders/${alert.entity_id}`,
    }
    router.push(routes[alert.entity_type] || '#')
  }

  // Handle activity click - navigate to entity detail
  const handleActivityClick = (activity: Activity) => {
    const routes: Record<string, string> = {
      purchase_order: `/planning/purchase-orders/${activity.entity_id}`,
      transfer_order: `/planning/transfer-orders/${activity.entity_id}`,
      work_order: `/planning/work-orders/${activity.entity_id}`,
    }
    router.push(routes[activity.entity_type] || '#')
  }

  // Check if all data is in zero/empty state
  const isZeroState =
    !loading.kpis &&
    !loading.alerts &&
    !loading.activities &&
    !error.kpis &&
    !error.alerts &&
    !error.activities &&
    data.kpis &&
    Object.values(data.kpis).every((v) => v === 0) &&
    data.alerts.length === 0 &&
    data.activities.length === 0

  return (
    <div>
      <PlanningHeader currentPage="dashboard" />

      <div className="px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Planning Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Monitor and manage purchase orders, transfer orders, and work orders
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick actions">
            <Button asChild>
              <Link href="/planning/purchase-orders/new">
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                Create PO
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/planning/transfer-orders/new">
                <Truck className="h-4 w-4 mr-1" aria-hidden="true" />
                Create TO
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/planning/work-orders/new">
                <Factory className="h-4 w-4 mr-1" aria-hidden="true" />
                Create WO
              </Link>
            </Button>
          </div>
        </div>

        {/* Zero State Help Message */}
        {isZeroState && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <p className="text-sm text-blue-700">
                Get started by creating your first Purchase Order, Transfer Order, or Work Order
                using the buttons above.
              </p>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards Section */}
        <section aria-labelledby="kpi-section-title">
          <h2 id="kpi-section-title" className="sr-only">
            Key Performance Indicators
          </h2>
          <KPICardsGrid
            data={data.kpis}
            loading={loading.kpis}
            error={error.kpis || undefined}
            onRetry={fetchKPIs}
            onCardClick={handleKPICardClick}
          />
        </section>

        {/* Main Content Grid: Alerts + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert Panel */}
          <section aria-labelledby="alerts-section-title">
            <h2 id="alerts-section-title" className="sr-only">
              Alerts
            </h2>
            <AlertPanel
              alerts={data.alerts}
              loading={loading.alerts}
              error={error.alerts || undefined}
              onAlertClick={handleAlertClick}
              onRetry={fetchAlerts}
            />
          </section>

          {/* Activity Feed */}
          <section aria-labelledby="activity-section-title">
            <h2 id="activity-section-title" className="sr-only">
              Recent Activity
            </h2>
            <ActivityFeed
              activities={data.activities}
              loading={loading.activities}
              error={error.activities || undefined}
              onActivityClick={handleActivityClick}
              onRetry={fetchActivities}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
