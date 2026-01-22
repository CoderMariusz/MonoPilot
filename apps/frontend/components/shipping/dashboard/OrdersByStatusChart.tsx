/**
 * Orders By Status Chart Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Pie chart showing orders breakdown by status
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrdersByStatusData } from '@/lib/types/shipping-dashboard'

// Status colors
const statusColors: Record<string, string> = {
  draft: '#94a3b8', // gray
  confirmed: '#60a5fa', // blue
  allocated: '#a78bfa', // purple
  picking: '#fbbf24', // yellow
  packing: '#f97316', // orange
  shipped: '#22c55e', // green
  delivered: '#14b8a6', // teal
}

export interface OrdersByStatusChartProps {
  data: OrdersByStatusData[]
  isLoading: boolean
  onStatusClick?: (status: string) => void
}

export function OrdersByStatusChart({
  data,
  isLoading,
  onStatusClick,
}: OrdersByStatusChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48" data-testid="chart-skeleton">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalOrders = data.reduce((sum, d) => sum + d.count, 0)

  if (!data.length || totalOrders === 0) {
    return (
      <Card data-testid="orders-status-chart">
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-center items-center h-48 text-gray-500">
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate percentages for display
  const dataWithPercentages = data.map((d) => ({
    ...d,
    percentage: Math.round((d.count / totalOrders) * 100),
  }))

  return (
    <Card data-testid="orders-status-chart">
      <CardHeader>
        <CardTitle>Orders by Status</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Simple visual representation without heavy chart library */}
        <div className="flex flex-col gap-4">
          {/* Bar visualization */}
          <div className="flex h-8 rounded-full overflow-hidden">
            {dataWithPercentages.map((item) => (
              <div
                key={item.status}
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: statusColors[item.status] || '#94a3b8',
                }}
                className="transition-all cursor-pointer hover:opacity-80"
                onClick={() => onStatusClick?.(item.status)}
                role="button"
                aria-label={`${item.status}: ${item.count} (${item.percentage}%)`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
            {dataWithPercentages.map((item) => (
              <div
                key={item.status}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                onClick={() => onStatusClick?.(item.status)}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusColors[item.status] || '#94a3b8' }}
                />
                <span className="text-sm capitalize">{item.status}</span>
                <span className="text-sm text-gray-500 tabular-nums">
                  ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OrdersByStatusChart
