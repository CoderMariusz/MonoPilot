'use client'

/**
 * OutputProgressCard Component (Story 04.7d)
 *
 * Displays WO progress with:
 * - Planned vs output quantities
 * - Progress bar with percentage
 * - Remaining quantity
 * - Status and auto-complete indicators
 * - Over-production handling (>100%)
 */

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, CheckCircle2, Package } from 'lucide-react'
import type { WOProgressResponse } from '@/lib/services/output-aggregation-service'

export interface OutputProgressCardProps {
  /** Progress data from API */
  progress: WOProgressResponse | null
  /** Loading state */
  isLoading?: boolean
  /** Unit of measure for display */
  uom?: string
  /** Optional additional CSS classes */
  className?: string
}

/**
 * Format number with commas and optional decimals
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/**
 * Get progress bar color class based on percentage
 */
function getProgressColor(percent: number): string {
  if (percent >= 100) return 'bg-green-500'
  if (percent >= 80) return 'bg-blue-500'
  if (percent >= 50) return 'bg-blue-400'
  return 'bg-blue-300'
}

/**
 * Get progress background class based on percentage
 */
function getProgressBgColor(percent: number): string {
  if (percent >= 100) return 'bg-green-100'
  return 'bg-blue-100'
}

/**
 * Loading skeleton for progress card
 */
function ProgressCardSkeleton() {
  return (
    <Card data-testid="progress-card-skeleton">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

export function OutputProgressCard({
  progress,
  isLoading = false,
  uom = 'kg',
  className,
}: OutputProgressCardProps) {
  // Loading state
  if (isLoading) {
    return <ProgressCardSkeleton />
  }

  // No data state
  if (!progress) {
    return (
      <Card className={className} data-testid="output-progress-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            Output Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No progress data available</p>
        </CardContent>
      </Card>
    )
  }

  const {
    planned_quantity,
    produced_quantity,
    progress_percent,
    remaining_qty,
    outputs_count,
    is_complete,
    auto_complete_enabled,
    status,
  } = progress

  const isOverProduction = progress_percent > 100
  const displayPercent = Math.min(progress_percent, 100) // Cap bar at 100

  return (
    <Card className={className} data-testid="output-progress-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            Output Progress
          </span>
          <div className="flex items-center gap-2">
            {is_complete && (
              <Badge
                variant="default"
                className="bg-green-500 hover:bg-green-600"
                data-testid="complete-badge"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
            {auto_complete_enabled && !is_complete && (
              <Badge variant="outline" data-testid="auto-complete-badge">
                Auto-Complete On
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quantities Row */}
        <div className="grid grid-cols-3 gap-4" data-testid="quantities-section">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Planned</p>
            <p className="text-lg font-mono font-semibold" data-testid="planned-qty">
              {formatNumber(planned_quantity)} <span className="text-sm font-normal">{uom}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Output</p>
            <p
              className={cn(
                'text-lg font-mono font-semibold',
                isOverProduction && 'text-green-600'
              )}
              data-testid="output-qty"
            >
              {formatNumber(produced_quantity)} <span className="text-sm font-normal">{uom}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</p>
            <p className="text-lg font-mono font-semibold" data-testid="remaining-qty">
              {formatNumber(remaining_qty)} <span className="text-sm font-normal">{uom}</span>
            </p>
          </div>
        </div>

        {/* Progress Bar Section */}
        <div className="space-y-2" data-testid="progress-section">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span
              className={cn(
                'font-medium font-mono',
                progress_percent >= 100 && 'text-green-600'
              )}
              data-testid="progress-percent"
            >
              {progress_percent.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={displayPercent}
            className={cn('h-3', getProgressBgColor(progress_percent))}
            data-testid="progress-bar"
            aria-valuenow={progress_percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Production progress: ${progress_percent.toFixed(1)}%`}
          />
          {isOverProduction && (
            <p
              className="text-xs text-green-600 flex items-center gap-1"
              data-testid="over-production-message"
            >
              <AlertTriangle className="h-3 w-3" />
              Over-production: {(progress_percent - 100).toFixed(1)}% above planned
            </p>
          )}
        </div>

        {/* Status Row */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span className="text-muted-foreground">
            <span data-testid="outputs-count">{outputs_count}</span>{' '}
            {outputs_count === 1 ? 'output' : 'outputs'} registered
          </span>
          <Badge variant={status === 'completed' ? 'default' : 'secondary'} data-testid="wo-status">
            {status.replace('_', ' ')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default OutputProgressCard
