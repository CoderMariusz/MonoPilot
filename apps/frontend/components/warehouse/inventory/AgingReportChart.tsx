/**
 * AgingReportChart Component
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Horizontal bar chart showing inventory aging distribution across buckets.
 * Buckets: 0-7 days (green), 8-30 days (yellow), 31-90 days (orange), 90+ days (red)
 */

'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AgingSummary } from '@/lib/services/aging-report-service'

interface AgingReportChartProps {
  data: AgingSummary | undefined
  mode: 'fifo' | 'fefo'
  className?: string
}

// Bucket colors matching the wireframe spec
const BUCKET_COLORS = {
  '0-7 days': '#22c55e', // Green
  '8-30 days': '#eab308', // Yellow
  '31-90 days': '#f97316', // Orange
  '90+ days': '#ef4444', // Red
} as const

// Bucket labels for FIFO and FEFO modes
const BUCKET_LABELS_FIFO = {
  '0-7 days': 'Very Fresh (0-7 days)',
  '8-30 days': 'Recent (8-30 days)',
  '31-90 days': 'Aging (31-90 days)',
  '90+ days': 'Old Stock (90+ days)',
} as const

const BUCKET_LABELS_FEFO = {
  '0-7 days': 'Expiring Soon (0-7 days)',
  '8-30 days': 'Expiring (8-30 days)',
  '31-90 days': 'Good Shelf Life (31-90 days)',
  '90+ days': 'Long Shelf Life (90+ days)',
} as const

interface ChartDataItem {
  bucket: string
  qty: number
  value: number
  color: string
  label: string
}

/**
 * Custom tooltip component for the chart
 */
function AgingChartTooltip({
  active,
  payload,
  mode,
}: {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: ChartDataItem
  }>
  mode: 'fifo' | 'fefo'
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0].payload

  return (
    <div
      className="bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 min-w-[180px]"
      role="tooltip"
    >
      <p className="font-semibold text-sm mb-2">{data.label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Quantity:</span>
          <span className="font-medium">{data.qty.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Value:</span>
          <span className="font-medium">
            ${data.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
        {mode === 'fifo' ? 'Age by receipt date' : 'Days until expiry'}
      </div>
    </div>
  )
}

/**
 * Custom legend component
 */
function AgingChartLegend() {
  const items = Object.entries(BUCKET_COLORS).map(([bucket, color]) => ({
    bucket,
    color,
  }))

  return (
    <div
      className="flex flex-wrap justify-center gap-4 mt-4"
      role="list"
      aria-label="Chart legend"
    >
      {items.map(({ bucket, color }) => (
        <div key={bucket} className="flex items-center gap-2" role="listitem">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="text-xs text-muted-foreground">{bucket}</span>
        </div>
      ))}
    </div>
  )
}

export function AgingReportChart({
  data,
  mode,
  className,
}: AgingReportChartProps) {
  // Transform summary data into chart format
  const chartData = useMemo((): ChartDataItem[] => {
    if (!data) {
      return []
    }

    const labels = mode === 'fifo' ? BUCKET_LABELS_FIFO : BUCKET_LABELS_FEFO

    return [
      {
        bucket: '0-7 days',
        qty: data.bucket_0_7.qty,
        value: data.bucket_0_7.value,
        color: BUCKET_COLORS['0-7 days'],
        label: labels['0-7 days'],
      },
      {
        bucket: '8-30 days',
        qty: data.bucket_8_30.qty,
        value: data.bucket_8_30.value,
        color: BUCKET_COLORS['8-30 days'],
        label: labels['8-30 days'],
      },
      {
        bucket: '31-90 days',
        qty: data.bucket_31_90.qty,
        value: data.bucket_31_90.value,
        color: BUCKET_COLORS['31-90 days'],
        label: labels['31-90 days'],
      },
      {
        bucket: '90+ days',
        qty: data.bucket_90_plus.qty,
        value: data.bucket_90_plus.value,
        color: BUCKET_COLORS['90+ days'],
        label: labels['90+ days'],
      },
    ]
  }, [data, mode])

  // Calculate total for percentage display
  const totalQty = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.qty, 0)
  }, [chartData])

  if (!data || chartData.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span>Age Distribution</span>
          <span className="text-sm font-normal text-muted-foreground">
            {mode === 'fifo' ? 'By Receipt Date' : 'By Expiry Date'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="h-[300px] w-full"
          role="img"
          aria-label={`Aging distribution chart showing ${chartData.length} buckets`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => value.toLocaleString()}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="bucket"
                axisLine={false}
                tickLine={false}
                width={90}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={<AgingChartTooltip mode={mode} />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
              <Bar
                dataKey="qty"
                name="Quantity"
                radius={[0, 4, 4, 0]}
                maxBarSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Percentage breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {chartData.map((item) => {
            const percentage = totalQty > 0 ? (item.qty / totalQty) * 100 : 0
            return (
              <div
                key={item.bucket}
                className="flex flex-col items-center p-2 rounded-lg"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <span className="text-xs text-muted-foreground">{item.bucket}</span>
                <span className="text-lg font-semibold" style={{ color: item.color }}>
                  {percentage.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.qty.toLocaleString()} units
                </span>
              </div>
            )
          })}
        </div>

        <AgingChartLegend />
      </CardContent>
    </Card>
  )
}
