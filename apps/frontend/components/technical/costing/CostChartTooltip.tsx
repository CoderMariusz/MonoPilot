'use client'

/**
 * CostChartTooltip Component (Story 02.15)
 * Custom tooltip for cost trend chart hover
 */

import { Card, CardContent } from '@/components/ui/card'
import { CostTrendIndicator } from './CostTrendIndicator'

interface CostDataPoint {
  total_cost?: number
  material_cost?: number
  labor_cost?: number
  overhead_cost?: number
  cost_per_unit?: number
  effective_from?: string
  change_amount?: number
  change_percent?: number
  bom_version?: string
  created_by?: string
  id?: string
}

export interface CostChartTooltipProps {
  active?: boolean
  payload?: Array<{ payload: CostDataPoint }>
  label?: string
  /** Handler for clicking "View Detail" */
  onDetailClick?: (id: string) => void
}

export function CostChartTooltip({
  active,
  payload,
  label,
  onDetailClick,
}: CostChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0]?.payload
  if (!data) return null

  const total = data.total_cost || 0
  const materialPct = total > 0 ? ((data.material_cost || 0) / total) * 100 : 0
  const laborPct = total > 0 ? ((data.labor_cost || 0) / total) * 100 : 0
  const overheadPct = total > 0 ? ((data.overhead_cost || 0) / total) * 100 : 0

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  return (
    <Card
      className="bg-white shadow-lg border border-gray-200"
      role="tooltip"
      aria-label={`Cost breakdown for ${formatDate(label || data.effective_from || '')}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="font-semibold text-sm border-b pb-2">
          Cost Breakdown - {formatDate(label || data.effective_from || '')}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-green-600">Material Cost:</span>
            <span className="font-medium">
              {formatCurrency(data.material_cost || 0)}
              <span className="text-gray-500 ml-1">({materialPct.toFixed(1)}%)</span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-orange-600">Labor Cost:</span>
            <span className="font-medium">
              {formatCurrency(data.labor_cost || 0)}
              <span className="text-gray-500 ml-1">({laborPct.toFixed(1)}%)</span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-purple-600">Overhead Cost:</span>
            <span className="font-medium">
              {formatCurrency(data.overhead_cost || 0)}
              <span className="text-gray-500 ml-1">({overheadPct.toFixed(1)}%)</span>
            </span>
          </div>

          <div className="border-t pt-2 flex justify-between items-center font-semibold">
            <span className="text-blue-600">Total Cost:</span>
            <span>{formatCurrency(total)} (100%)</span>
          </div>
        </div>

        {data.cost_per_unit && (
          <div className="text-sm text-gray-600 pt-1">
            Cost per Unit: {formatCurrency(data.cost_per_unit)}/kg
          </div>
        )}

        {data.change_amount !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Change from Previous:</span>
            <CostTrendIndicator value={data.change_percent || 0} size="sm" />
          </div>
        )}

        {data.bom_version && (
          <div className="text-xs text-gray-500 pt-1">
            BOM Version: v{data.bom_version} | Calculated by: {data.created_by || 'System'}
          </div>
        )}

        {onDetailClick && data.id && (
          <button
            onClick={() => onDetailClick(data.id!)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label="Click for full detail"
          >
            Click for Full Detail
          </button>
        )}
      </CardContent>
    </Card>
  )
}
