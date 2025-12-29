/**
 * MarginAnalysis Component (Story 02.9)
 * Margin calculation display with warning indicator
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/lib/utils/format-currency'

interface MarginAnalysisProps {
  stdPrice: number | null
  targetMargin: number
  actualMargin: number | null
  belowTarget: boolean
  currency?: string
}

export function MarginAnalysis({
  stdPrice,
  targetMargin,
  actualMargin,
  belowTarget,
  currency = 'PLN',
}: MarginAnalysisProps) {
  // Show message if no standard price is set
  if (!stdPrice || actualMargin === null) {
    return (
      <div className="text-sm text-muted-foreground border-t pt-4 mt-4">
        Set standard price on product to see margin analysis
      </div>
    )
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">Margin Analysis</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Standard Price */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Standard Price</p>
          <p className="text-lg font-semibold mt-1">{formatCurrency(stdPrice, currency)}</p>
        </div>

        {/* Target Margin */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Target Margin</p>
          <p className="text-lg font-semibold mt-1">{formatPercent(targetMargin)}</p>
        </div>

        {/* Actual Margin */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Actual Margin</p>
          <div className="flex items-center gap-2 mt-1">
            <p
              className={`text-lg font-semibold ${
                belowTarget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}
            >
              {formatPercent(actualMargin)}
            </p>
            {belowTarget && (
              <Badge variant="destructive" className="text-xs">
                Below target
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
