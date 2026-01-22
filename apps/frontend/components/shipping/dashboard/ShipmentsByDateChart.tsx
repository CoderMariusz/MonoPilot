/**
 * Shipments By Date Chart Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Line/bar chart showing shipments over time
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ShipmentsByDateData, DateRange } from '@/lib/types/shipping-dashboard'

export interface ShipmentsByDateChartProps {
  data: ShipmentsByDateData[]
  isLoading: boolean
  dateRange: DateRange
}

export function ShipmentsByDateChart({
  data,
  isLoading,
  dateRange,
}: ShipmentsByDateChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shipments Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48" data-testid="chart-skeleton">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data.length) {
    return (
      <Card data-testid="shipments-date-chart">
        <CardHeader>
          <CardTitle>Shipments Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-center items-center h-48 text-gray-500">
            <p>No shipments in selected period</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find max count for scaling
  const maxCount = Math.max(...data.map((d) => d.count))

  return (
    <Card data-testid="shipments-date-chart">
      <CardHeader>
        <CardTitle>Shipments Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Simple bar chart visualization */}
        <div className="flex items-end justify-between h-48 gap-1">
          {data.map((item) => {
            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
            const dateLabel = new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })

            return (
              <div
                key={item.date}
                className="flex flex-col items-center flex-1 max-w-8"
              >
                <div
                  className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ height: `${height}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                  title={`${dateLabel}: ${item.count} shipments`}
                />
                {data.length <= 14 && (
                  <span className="text-xs text-gray-500 mt-1 -rotate-45 origin-top-left whitespace-nowrap">
                    {dateLabel}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t text-sm">
          <span className="text-gray-500">
            Total: {data.reduce((sum, d) => sum + d.count, 0)} shipments
          </span>
          <span className="text-gray-500">
            {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default ShipmentsByDateChart
