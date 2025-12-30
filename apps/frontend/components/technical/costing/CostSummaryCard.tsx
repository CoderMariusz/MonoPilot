'use client'

/**
 * CostSummaryCard Component (Story 02.15)
 * Current cost summary with trends
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CostTrendIndicator } from './CostTrendIndicator'
import { ExternalLink } from 'lucide-react'
import type { CostHistorySummary } from '@/lib/types/cost-history'

export interface CostSummaryCardProps {
  /** Cost summary data */
  summary: CostHistorySummary
  /** Product code for display */
  productCode: string
  /** Handler for "View Latest Costing" button */
  onViewLatest?: () => void
  /** Current cost date */
  currentDate?: string
  /** Previous cost date */
  previousDate?: string
}

export function CostSummaryCard({
  summary,
  productCode,
  onViewLatest,
  currentDate,
  previousDate,
}: CostSummaryCardProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const hasPreviousCost = summary.previous_cost !== null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          Current Cost Summary
        </CardTitle>
        {onViewLatest && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewLatest}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            View Latest Costing
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Current Total Cost</p>
            <p className="text-2xl font-bold">
              {formatCurrency(summary.current_cost_per_unit)}
              <span className="text-sm font-normal text-gray-500"> /kg</span>
            </p>
            {currentDate && (
              <p className="text-xs text-gray-400">as of {formatDate(currentDate)}</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500">Previous Cost</p>
            {hasPreviousCost ? (
              <>
                <p className="text-xl font-semibold">
                  {formatCurrency(summary.previous_cost)}
                  <span className="text-sm font-normal text-gray-500"> /kg</span>
                </p>
                {previousDate && (
                  <p className="text-xs text-gray-400">{formatDate(previousDate)}</p>
                )}
              </>
            ) : (
              <p className="text-gray-400 italic">N/A (first calculation)</p>
            )}
          </div>
        </div>

        {/* Change */}
        {hasPreviousCost && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-500">Change</p>
            <div className="flex items-center gap-2 text-lg">
              <span
                className={
                  summary.change_amount > 0
                    ? 'text-red-600'
                    : summary.change_amount < 0
                      ? 'text-green-600'
                      : 'text-gray-600'
                }
              >
                {summary.change_amount > 0 ? '+' : ''}
                {formatCurrency(summary.change_amount)}
              </span>
              <CostTrendIndicator value={summary.change_percentage} size="md" />
            </div>
          </div>
        )}

        {/* Trends */}
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-500 mb-2">Cost Trends</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400">30-Day</p>
              <CostTrendIndicator value={summary.trend_30d} size="md" />
            </div>
            <div>
              <p className="text-xs text-gray-400">90-Day</p>
              <CostTrendIndicator value={summary.trend_90d} size="md" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Year-to-Date</p>
              <CostTrendIndicator value={summary.trend_ytd} size="md" />
            </div>
          </div>
        </div>

        {/* First calculation info */}
        {!hasPreviousCost && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-medium">First Cost Calculation</p>
            <p className="text-blue-600">
              Trends will appear after multiple calculations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
