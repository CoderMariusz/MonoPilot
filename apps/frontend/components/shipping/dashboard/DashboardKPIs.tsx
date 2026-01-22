/**
 * Dashboard KPIs Grid Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Grid of 4 KPI cards:
 * - Orders
 * - Pick Lists
 * - Shipments
 * - Backorders
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { KPICard } from './KPICard'
import {
  ShoppingCart,
  ClipboardList,
  Package,
  AlertCircle,
} from 'lucide-react'
import type { DashboardKPIs as DashboardKPIsType } from '@/lib/types/shipping-dashboard'

export interface DashboardKPIsProps {
  data: DashboardKPIsType | null
  isLoading: boolean
}

export function DashboardKPIs({ data, isLoading }: DashboardKPIsProps) {
  if (isLoading || !data) {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        data-testid="dashboard-kpis"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border p-4 space-y-3"
            data-testid="kpi-skeleton"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    )
  }

  // Determine statuses based on values
  const getBackorderStatus = () => {
    if (data.backorders.count === 0) return 'good'
    if (data.backorders.count <= 5) return 'warning'
    return 'critical'
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      data-testid="dashboard-kpis"
      role="region"
      aria-label="Key Performance Indicators"
    >
      <KPICard
        title="Orders"
        value={data.orders.total}
        icon={<ShoppingCart className="h-6 w-6" />}
        status="good"
        trend={data.orders.trend}
        breakdown={data.orders.by_status}
      />

      <KPICard
        title="Pick Lists"
        value={data.pick_lists.total}
        icon={<ClipboardList className="h-6 w-6" />}
        status="good"
        trend={data.pick_lists.trend}
        breakdown={data.pick_lists.by_status}
      />

      <KPICard
        title="Shipments"
        value={data.shipments.total}
        icon={<Package className="h-6 w-6" />}
        status="good"
        trend={data.shipments.trend}
        breakdown={data.shipments.by_status}
      />

      <KPICard
        title="Backorders"
        value={data.backorders.count}
        icon={<AlertCircle className="h-6 w-6" />}
        status={getBackorderStatus()}
        breakdown={{
          count: data.backorders.count,
          total_value: data.backorders.total_value,
        }}
      />
    </div>
  )
}

export default DashboardKPIs
