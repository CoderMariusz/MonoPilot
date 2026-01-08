'use client'

/**
 * YieldGauge Component
 * Story: 04.4 - Yield Tracking
 *
 * Visual yield percentage indicator with color coding.
 * Displays progress bar, percentage, status badge, and planned/produced quantities.
 *
 * Color Mapping (AC-4):
 * - Green: >= 80% (Excellent)
 * - Yellow: 70% - 79.9% (Below Target)
 * - Red: < 70% (Low Yield)
 * - Gray: 0% (Not Started)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type YieldStatus = 'excellent' | 'below_target' | 'low_yield' | 'not_started'

export interface YieldGaugeProps {
  /** Yield percentage (0-100+) */
  yieldPercent: number
  /** Status for styling */
  status: YieldStatus
  /** Planned production quantity */
  plannedQuantity: number
  /** Current produced quantity */
  producedQuantity: number
  /** Unit of measure for display */
  uom?: string
  /** Whether the WO is completed */
  isCompleted?: boolean
  /** Loading state */
  isLoading?: boolean
}

/**
 * Get color classes based on yield status
 */
function getStatusColors(status: YieldStatus) {
  switch (status) {
    case 'excellent':
      return {
        progress: 'bg-green-500',
        badge: 'bg-green-100 text-green-800 border-green-200',
        text: 'text-green-600',
      }
    case 'below_target':
      return {
        progress: 'bg-yellow-500',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'text-yellow-600',
      }
    case 'low_yield':
      return {
        progress: 'bg-red-500',
        badge: 'bg-red-100 text-red-800 border-red-200',
        text: 'text-red-600',
      }
    case 'not_started':
    default:
      return {
        progress: 'bg-gray-300',
        badge: 'bg-gray-100 text-gray-600 border-gray-200',
        text: 'text-gray-500',
      }
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: YieldStatus): string {
  switch (status) {
    case 'excellent':
      return 'Excellent'
    case 'below_target':
      return 'Below Target'
    case 'low_yield':
      return 'Low Yield'
    case 'not_started':
    default:
      return 'Not Started'
  }
}

/**
 * Get yield status from percentage
 */
export function getYieldStatus(yieldPercent: number): YieldStatus {
  if (yieldPercent === 0) return 'not_started'
  if (yieldPercent >= 80) return 'excellent'
  if (yieldPercent >= 70) return 'below_target'
  return 'low_yield'
}

/**
 * Loading skeleton for YieldGauge
 */
export function YieldGaugeSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Current Yield</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-4 w-full rounded-full" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-5 w-24" />
        <div className="flex justify-between text-sm">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}

export function YieldGauge({
  yieldPercent,
  status,
  plannedQuantity,
  producedQuantity,
  uom = 'units',
  isCompleted = false,
  isLoading = false,
}: YieldGaugeProps) {
  if (isLoading) {
    return <YieldGaugeSkeleton />
  }

  const colors = getStatusColors(status)
  const label = getStatusLabel(status)

  // Cap progress bar at 100% for display, but show actual percentage
  const progressValue = Math.min(yieldPercent, 100)

  // Format numbers with locale
  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num)

  // Format yield percentage with 1 decimal
  const formattedYield = yieldPercent.toFixed(1)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          {isCompleted ? 'Final Yield' : 'Current Yield'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar with percentage */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div
              className="relative h-4 w-full overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-valuenow={yieldPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Yield: ${formattedYield}%`}
            >
              <div
                className={cn('h-full transition-all duration-300 ease-out', colors.progress)}
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
          <span className={cn('text-lg font-semibold', colors.text)} aria-live="polite">
            {formattedYield}%
          </span>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-xs', colors.badge)}>
            {label}
          </Badge>
          {isCompleted && (
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
              Completed
            </Badge>
          )}
        </div>

        {/* Planned vs Produced quantities */}
        <div className="flex justify-between text-sm text-muted-foreground">
          <div>
            <span className="text-gray-500">Planned: </span>
            <span className="font-medium text-gray-700">
              {formatNumber(plannedQuantity)} {uom}
            </span>
          </div>
          <div>
            <span className="text-gray-500">{isCompleted ? 'Final Produced: ' : 'Produced: '}</span>
            <span className={cn('font-medium', colors.text)}>
              {formatNumber(producedQuantity)} {uom}
            </span>
          </div>
        </div>

        {/* Screen reader summary */}
        <span className="sr-only">
          {isCompleted ? 'Final yield' : 'Current yield'}: {formattedYield} percent. Status:{' '}
          {label}. Planned quantity: {formatNumber(plannedQuantity)} {uom}. Produced quantity:{' '}
          {formatNumber(producedQuantity)} {uom}.
        </span>
      </CardContent>
    </Card>
  )
}

export default YieldGauge
