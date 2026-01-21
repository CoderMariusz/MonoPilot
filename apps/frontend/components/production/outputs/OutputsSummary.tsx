'use client'

/**
 * OutputsSummary Component (Story 04.7d)
 *
 * Displays aggregate statistics for WO outputs:
 * - Total outputs count and quantity
 * - Breakdown by QA status (Approved, Pending, Rejected)
 */

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, Clock, XCircle, Package } from 'lucide-react'
import type { OutputsSummary as OutputsSummaryType } from '@/lib/services/output-aggregation-service'

export interface OutputsSummaryProps {
  /** Summary data from API */
  summary: OutputsSummaryType
  /** Unit of measure for display */
  uom?: string
  /** Loading state */
  isLoading?: boolean
  /** Optional additional CSS classes */
  className?: string
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/**
 * Loading skeleton for summary card
 */
function SummarySkeleton() {
  return (
    <Card data-testid="summary-skeleton">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Stat item component
 */
function StatItem({
  label,
  count,
  qty,
  uom,
  icon: Icon,
  colorClass,
  testId,
}: {
  label: string
  count: number
  qty: number
  uom: string
  icon: typeof Package
  colorClass: string
  testId: string
}) {
  return (
    <div className="space-y-1" data-testid={testId}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn('h-4 w-4', colorClass)} />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-mono font-semibold">
        <span data-testid={`${testId}-count`}>{count}</span>
      </p>
      <p className="text-sm text-muted-foreground font-mono">
        <span data-testid={`${testId}-qty`}>{formatNumber(qty)}</span> {uom}
      </p>
    </div>
  )
}

export function OutputsSummary({
  summary,
  uom = 'kg',
  isLoading = false,
  className,
}: OutputsSummaryProps) {
  // Loading state
  if (isLoading) {
    return <SummarySkeleton />
  }

  const {
    total_outputs,
    total_qty,
    approved_count,
    approved_qty,
    pending_count,
    pending_qty,
    rejected_count,
    rejected_qty,
  } = summary

  return (
    <Card className={className} data-testid="outputs-summary">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          Outputs Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total */}
          <StatItem
            label="Total"
            count={total_outputs}
            qty={total_qty}
            uom={uom}
            icon={Package}
            colorClass="text-blue-500"
            testId="stat-total"
          />

          {/* Approved */}
          <StatItem
            label="Approved"
            count={approved_count}
            qty={approved_qty}
            uom={uom}
            icon={CheckCircle}
            colorClass="text-green-500"
            testId="stat-approved"
          />

          {/* Pending */}
          <StatItem
            label="Pending"
            count={pending_count}
            qty={pending_qty}
            uom={uom}
            icon={Clock}
            colorClass="text-yellow-500"
            testId="stat-pending"
          />

          {/* Rejected */}
          <StatItem
            label="Rejected"
            count={rejected_count}
            qty={rejected_qty}
            uom={uom}
            icon={XCircle}
            colorClass="text-red-500"
            testId="stat-rejected"
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default OutputsSummary
