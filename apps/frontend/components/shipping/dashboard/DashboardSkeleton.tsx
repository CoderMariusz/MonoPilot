/**
 * Dashboard Skeleton Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Loading state skeleton for the shipping dashboard
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
      data-testid="dashboard-skeleton"
    >
      {/* KPI Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Chart Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border p-4 space-y-4"
            data-testid="chart-skeleton"
          >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>

      {/* Alerts Skeleton */}
      <div
        className="bg-white rounded-lg border p-4 space-y-4"
        data-testid="alerts-skeleton"
      >
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>

      {/* Activity Skeleton */}
      <div
        className="bg-white rounded-lg border p-4 space-y-4"
        data-testid="activity-skeleton"
      >
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardSkeleton
