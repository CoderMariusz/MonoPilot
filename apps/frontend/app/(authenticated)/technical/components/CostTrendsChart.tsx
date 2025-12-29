'use client'

/**
 * CostTrendsChart Component (Story 02.12)
 * AC-12.20 to AC-12.22: Recharts line chart for cost trends
 *
 * Features:
 * - Toggle buttons: Material / Labor / Overhead / Total
 * - Line chart (Recharts LineChart)
 * - Y-axis: Cost (PLN), X-axis: Months
 * - Hover tooltip with cost breakdown
 * - Click to navigate to cost history
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { CostTrendsResponse } from '@/lib/types/dashboard'

interface CostTrendsChartProps {
  data?: CostTrendsResponse
  onChartClick?: () => void
  loading?: boolean
  error?: string
  onRetry?: () => void
}

// Line configuration
const lineConfig = {
  material_cost: { color: '#3B82F6', label: 'Material', strokeWidth: 2 },
  labor_cost: { color: '#10B981', label: 'Labor', strokeWidth: 2 },
  overhead_cost: { color: '#FBBF24', label: 'Overhead', strokeWidth: 2 },
  total_cost: { color: '#111827', label: 'Total', strokeWidth: 3 }
} as const

type CostType = keyof typeof lineConfig

// Skeleton for loading state
function CostTrendsChartSkeleton() {
  return (
    <Card className="h-full" data-testid="cost-trends-chart">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  )
}

// Empty state
function CostTrendsChartEmpty() {
  return (
    <div className="text-center py-12">
      <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No cost data</h3>
      <p className="mt-1 text-sm text-gray-500">
        No cost data available. Add product costs to see trends.
      </p>
    </div>
  )
}

// Error state
function CostTrendsChartError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">Failed to load cost trends</h3>
      <p className="mt-1 text-sm text-gray-500">{error}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  )
}

// Custom tooltip
function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border text-sm" role="tooltip">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium">
            {entry.value.toFixed(2)} {currency}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CostTrendsChart({
  data,
  onChartClick,
  loading,
  error,
  onRetry
}: CostTrendsChartProps) {
  const router = useRouter()
  const [activeLines, setActiveLines] = useState<Set<CostType>>(
    new Set(['total_cost'])
  )

  if (loading) {
    return <CostTrendsChartSkeleton />
  }

  if (error) {
    return (
      <Card className="h-full" data-testid="cost-trends-chart">
        <CardContent className="p-6">
          <CostTrendsChartError error={error} onRetry={onRetry} />
        </CardContent>
      </Card>
    )
  }

  // Check if data has any values
  const hasData = data?.data?.some(d =>
    d.material_cost > 0 || d.labor_cost > 0 || d.overhead_cost > 0 || d.total_cost > 0
  )

  if (!data || !hasData) {
    return (
      <Card className="h-full" data-testid="cost-trends-chart">
        <CardContent className="p-6">
          <CostTrendsChartEmpty />
        </CardContent>
      </Card>
    )
  }

  const toggleLine = (costType: CostType) => {
    setActiveLines(prev => {
      const next = new Set(prev)
      if (next.has(costType)) {
        next.delete(costType)
      } else {
        next.add(costType)
      }
      return next
    })
  }

  const handleChartClick = () => {
    if (onChartClick) {
      onChartClick()
    } else {
      router.push('/technical/costing/history')
    }
  }

  // Format month label
  const formatMonth = (month: string) => {
    const [year, m] = month.split('-')
    const date = new Date(parseInt(year), parseInt(m) - 1)
    return date.toLocaleDateString('en-US', { month: 'short' })
  }

  // Chart data with formatted months
  const chartData = data.data.map(d => ({
    ...d,
    month: formatMonth(d.month)
  }))

  return (
    <Card className="h-full" data-testid="cost-trends-chart">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg">Cost Trends</CardTitle>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(lineConfig) as CostType[]).map((costType) => (
              <Button
                key={costType}
                variant={activeLines.has(costType) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleLine(costType)}
                className={cn(
                  'text-xs px-2 py-1',
                  activeLines.has(costType) && costType === 'material_cost' && 'bg-blue-500 hover:bg-blue-600',
                  activeLines.has(costType) && costType === 'labor_cost' && 'bg-green-500 hover:bg-green-600',
                  activeLines.has(costType) && costType === 'overhead_cost' && 'bg-yellow-500 hover:bg-yellow-600',
                  activeLines.has(costType) && costType === 'total_cost' && 'bg-gray-900 hover:bg-gray-800'
                )}
              >
                {lineConfig[costType].label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="h-[250px] cursor-pointer"
          onClick={handleChartClick}
          role="img"
          aria-label={`Cost trends chart, last ${data.months.length} months, ${Array.from(activeLines).map(l => lineConfig[l].label).join(', ')} selected`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(value) => `${value}`}
                label={{
                  value: `Cost (${data.currency})`,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 10, fill: '#6B7280' }
                }}
              />
              <Tooltip content={<CustomTooltip currency={data.currency} />} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="line"
              />

              {activeLines.has('material_cost') && (
                <Line
                  type="monotone"
                  dataKey="material_cost"
                  name="Material"
                  stroke={lineConfig.material_cost.color}
                  strokeWidth={lineConfig.material_cost.strokeWidth}
                  dot={{ fill: lineConfig.material_cost.color, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                  data-testid="chart-line-material"
                />
              )}

              {activeLines.has('labor_cost') && (
                <Line
                  type="monotone"
                  dataKey="labor_cost"
                  name="Labor"
                  stroke={lineConfig.labor_cost.color}
                  strokeWidth={lineConfig.labor_cost.strokeWidth}
                  dot={{ fill: lineConfig.labor_cost.color, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                  data-testid="chart-line-labor"
                />
              )}

              {activeLines.has('overhead_cost') && (
                <Line
                  type="monotone"
                  dataKey="overhead_cost"
                  name="Overhead"
                  stroke={lineConfig.overhead_cost.color}
                  strokeWidth={lineConfig.overhead_cost.strokeWidth}
                  dot={{ fill: lineConfig.overhead_cost.color, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                  data-testid="chart-line-overhead"
                />
              )}

              {activeLines.has('total_cost') && (
                <Line
                  type="monotone"
                  dataKey="total_cost"
                  name="Total"
                  stroke={lineConfig.total_cost.color}
                  strokeWidth={lineConfig.total_cost.strokeWidth}
                  dot={{ fill: lineConfig.total_cost.color, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                  data-testid="chart-line-total"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default CostTrendsChart
