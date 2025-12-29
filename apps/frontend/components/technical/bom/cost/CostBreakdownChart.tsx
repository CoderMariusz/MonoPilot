/**
 * CostBreakdownChart Component (Story 02.9)
 * Horizontal bar chart showing cost category percentages
 */

'use client'

import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatPercent } from '@/lib/utils/format-currency'

interface CostBreakdownChartProps {
  materialCost: number
  laborCost: number
  overheadCost: number
  currency?: string
}

export function CostBreakdownChart({
  materialCost,
  laborCost,
  overheadCost,
  currency = 'PLN',
}: CostBreakdownChartProps) {
  const total = materialCost + laborCost + overheadCost

  // Avoid division by zero
  if (total === 0) {
    return (
      <div className="text-sm text-muted-foreground mt-4">
        No cost data to display
      </div>
    )
  }

  const materialPercent = (materialCost / total) * 100
  const laborPercent = (laborCost / total) * 100
  const overheadPercent = (overheadCost / total) * 100

  return (
    <div className="space-y-3 mt-4" role="img" aria-label="Cost breakdown chart">
      {/* Material Costs */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-blue-700 dark:text-blue-400">Material</span>
            <span className="text-muted-foreground">
              {formatCurrency(materialCost, currency)} ({formatPercent(materialPercent)})
            </span>
          </div>
          <Progress
            value={materialPercent}
            className="h-3 bg-blue-100 dark:bg-blue-950"
            aria-label={`Material costs: ${formatPercent(materialPercent)}`}
          />
        </div>
      </div>

      {/* Labor Costs */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-green-700 dark:text-green-400">Labor</span>
            <span className="text-muted-foreground">
              {formatCurrency(laborCost, currency)} ({formatPercent(laborPercent)})
            </span>
          </div>
          <Progress
            value={laborPercent}
            className="h-3 bg-green-100 dark:bg-green-950 [&>div]:bg-green-500"
            aria-label={`Labor costs: ${formatPercent(laborPercent)}`}
          />
        </div>
      </div>

      {/* Overhead Costs */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-orange-700 dark:text-orange-400">Overhead</span>
            <span className="text-muted-foreground">
              {formatCurrency(overheadCost, currency)} ({formatPercent(overheadPercent)})
            </span>
          </div>
          <Progress
            value={overheadPercent}
            className="h-3 bg-orange-100 dark:bg-orange-950 [&>div]:bg-orange-500"
            aria-label={`Overhead costs: ${formatPercent(overheadPercent)}`}
          />
        </div>
      </div>
    </div>
  )
}
