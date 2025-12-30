'use client'

/**
 * CostTrendChart Component (Story 02.15)
 * Interactive Recharts line chart for cost trends
 */

import { useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CostChartTooltip } from './CostChartTooltip'
import type { CostHistoryItem } from '@/lib/types/cost-history'

export interface ChartToggles {
  material: boolean
  labor: boolean
  overhead: boolean
  total: boolean
}

export interface CostTrendChartProps {
  /** Cost history data to display */
  data: CostHistoryItem[]
  /** Toggle state for each line */
  toggles: ChartToggles
  /** Handler for toggle changes */
  onToggleChange: (component: string, value: boolean) => void
  /** Handler for clicking a data point */
  onPointClick: (item: CostHistoryItem) => void
}

// Chart colors for each component
const CHART_COLORS = {
  material: '#22c55e', // green
  labor: '#f97316', // orange
  overhead: '#a855f7', // purple
  total: '#3b82f6', // blue
}

export function CostTrendChart({
  data,
  toggles,
  onToggleChange,
  onPointClick,
}: CostTrendChartProps) {
  // Format data for chart
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.effective_from).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
  }))

  // Handle chart click
  const handleChartClick = useCallback(
    (chartData: any) => {
      if (chartData?.activePayload?.[0]?.payload) {
        onPointClick(chartData.activePayload[0].payload)
      }
    },
    [onPointClick]
  )

  // Handle tooltip detail click
  const handleTooltipDetailClick = useCallback(
    (id: string) => {
      const item = data.find((d) => d.id === id)
      if (item) {
        onPointClick(item)
      }
    },
    [data, onPointClick]
  )

  // Format currency for Y axis
  const formatYAxis = (value: number) => {
    return `$${value.toFixed(0)}`
  }

  return (
    <div className="space-y-4" data-testid="cost-trend-chart">
      {/* Toggle controls */}
      <div
        className="flex flex-wrap gap-4 p-2 bg-gray-50 rounded-lg"
        role="group"
        aria-label="Chart line toggles"
      >
        <div className="flex items-center space-x-2">
          <Checkbox
            id="toggle-material"
            checked={toggles.material}
            onCheckedChange={(checked) =>
              onToggleChange('material', checked === true)
            }
            aria-label="Toggle Material line"
          />
          <Label
            htmlFor="toggle-material"
            className="flex items-center gap-1 cursor-pointer"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CHART_COLORS.material }}
            />
            Material
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="toggle-labor"
            checked={toggles.labor}
            onCheckedChange={(checked) =>
              onToggleChange('labor', checked === true)
            }
            aria-label="Toggle Labor line"
          />
          <Label
            htmlFor="toggle-labor"
            className="flex items-center gap-1 cursor-pointer"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CHART_COLORS.labor }}
            />
            Labor
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="toggle-overhead"
            checked={toggles.overhead}
            onCheckedChange={(checked) =>
              onToggleChange('overhead', checked === true)
            }
            aria-label="Toggle Overhead line"
          />
          <Label
            htmlFor="toggle-overhead"
            className="flex items-center gap-1 cursor-pointer"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CHART_COLORS.overhead }}
            />
            Overhead
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="toggle-total"
            checked={toggles.total}
            onCheckedChange={(checked) =>
              onToggleChange('total', checked === true)
            }
            aria-label="Toggle Total line"
          />
          <Label
            htmlFor="toggle-total"
            className="flex items-center gap-1 cursor-pointer"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CHART_COLORS.total }}
            />
            Total
          </Label>
        </div>
      </div>

      {/* Chart */}
      <div
        className="w-full"
        style={{ minHeight: '400px' }}
        role="img"
        aria-label="Cost trend chart showing material, labor, overhead, and total costs over time"
      >
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            onClick={handleChartClick}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              content={
                <CostChartTooltip onDetailClick={handleTooltipDetailClick} />
              }
            />
            <Legend />

            {toggles.material && (
              <Line
                type="monotone"
                dataKey="material_cost"
                name="Material"
                stroke={CHART_COLORS.material}
                strokeWidth={2}
                dot={{ r: 4, cursor: 'pointer' }}
                activeDot={{ r: 6, cursor: 'pointer' }}
              />
            )}

            {toggles.labor && (
              <Line
                type="monotone"
                dataKey="labor_cost"
                name="Labor"
                stroke={CHART_COLORS.labor}
                strokeWidth={2}
                dot={{ r: 4, cursor: 'pointer' }}
                activeDot={{ r: 6, cursor: 'pointer' }}
              />
            )}

            {toggles.overhead && (
              <Line
                type="monotone"
                dataKey="overhead_cost"
                name="Overhead"
                stroke={CHART_COLORS.overhead}
                strokeWidth={2}
                dot={{ r: 4, cursor: 'pointer' }}
                activeDot={{ r: 6, cursor: 'pointer' }}
              />
            )}

            {toggles.total && (
              <Line
                type="monotone"
                dataKey="total_cost"
                name="Total"
                stroke={CHART_COLORS.total}
                strokeWidth={3}
                dot={{ r: 5, cursor: 'pointer' }}
                activeDot={{ r: 7, cursor: 'pointer' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Accessibility: data table alternative */}
      <details className="text-sm text-gray-600">
        <summary className="cursor-pointer hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1">
          View data as table (accessibility)
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-xs border">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2">Date</th>
                <th className="border p-2">Material</th>
                <th className="border p-2">Labor</th>
                <th className="border p-2">Overhead</th>
                <th className="border p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td className="border p-2">
                    {new Date(item.effective_from).toLocaleDateString()}
                  </td>
                  <td className="border p-2">${item.material_cost.toFixed(2)}</td>
                  <td className="border p-2">${item.labor_cost.toFixed(2)}</td>
                  <td className="border p-2">${item.overhead_cost.toFixed(2)}</td>
                  <td className="border p-2 font-medium">
                    ${item.total_cost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
