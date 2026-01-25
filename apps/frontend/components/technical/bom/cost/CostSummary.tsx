/**
 * CostSummary Component (Story 02.9)
 * Main cost summary card with totals, breakdown, and margin analysis
 *
 * Handles 4 UI states:
 * - Loading: CostSummaryLoading skeleton
 * - Empty: CostSummaryEmpty with setup instructions
 * - Error: CostSummaryError with specific messages
 * - Success: Full cost breakdown display
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBOMCost } from '@/lib/hooks/use-bom-cost'
import { useRecalculateCost } from '@/lib/hooks/use-recalculate-cost'
import { formatCurrency } from '@/lib/utils/format-currency'
import { CostSummaryLoading } from './CostSummaryLoading'
import { CostSummaryEmpty } from './CostSummaryEmpty'
import { CostSummaryError } from './CostSummaryError'
import { CostBreakdownChart } from './CostBreakdownChart'
import { MarginAnalysis } from './MarginAnalysis'
import { RecalculateButton } from './RecalculateButton'
import { StaleCostWarning } from './StaleCostWarning'

interface CostSummaryProps {
  bomId: string
  onRecalculate?: () => void
}

export function CostSummary({ bomId, onRecalculate }: CostSummaryProps) {
  const { data: cost, isLoading, error, refetch } = useBOMCost(bomId)
  const { mutateAsync: recalculate } = useRecalculateCost()

  // Loading state
  if (isLoading) {
    return <CostSummaryLoading />
  }

  // Error state
  if (error) {
    return (
      <CostSummaryError
        error={error}
        bomId={bomId}
        onRetry={() => refetch()}
      />
    )
  }

  // Empty state
  if (!cost) {
    return <CostSummaryEmpty bomId={bomId} />
  }

  // Handle recalculate action
  const handleRecalculate = async () => {
    await recalculate(bomId)
    await refetch()
    onRecalculate?.()
  }

  // Format the calculated date
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card data-testid="cost-summary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Cost Summary</CardTitle>
        <RecalculateButton onClick={handleRecalculate} disabled={false} />
      </CardHeader>
      <CardContent>
        {/* Stale cost warning */}
        {cost.is_stale && <StaleCostWarning />}

        {/* Cost totals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Cost per Batch ({cost.batch_size} {cost.batch_uom})
            </p>
            <p data-testid="total-cost" className="text-2xl font-bold mt-1">
              {formatCurrency(cost.total_cost, cost.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Cost per Unit
            </p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(cost.cost_per_unit, cost.currency)}
            </p>
          </div>
        </div>

        {/* Cost breakdown chart */}
        <CostBreakdownChart
          materialCost={cost.material_cost}
          laborCost={cost.labor_cost}
          overheadCost={cost.overhead_cost}
          currency={cost.currency}
        />

        {/* Margin analysis */}
        {cost.margin_analysis && (
          <MarginAnalysis
            stdPrice={cost.margin_analysis.std_price}
            targetMargin={cost.margin_analysis.target_margin_percent}
            actualMargin={cost.margin_analysis.actual_margin_percent}
            belowTarget={cost.margin_analysis.below_target}
            currency={cost.currency}
          />
        )}

        {/* Last calculated timestamp */}
        <div className="text-sm text-muted-foreground mt-4">
          Last Calculated: {formatDateTime(cost.calculated_at)}
        </div>
      </CardContent>
    </Card>
  )
}
