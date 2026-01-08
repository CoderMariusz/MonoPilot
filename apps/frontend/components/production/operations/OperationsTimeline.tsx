'use client'

/**
 * OperationsTimeline Component
 * Story: 04.3 - Operation Start/Complete
 *
 * Visual horizontal timeline showing all operations in sequence with status indicators.
 * Includes all 4 states: loading, error, empty, success.
 * Responsive: horizontal on desktop, vertical stack on mobile.
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Clock,
  AlertCircle,
  ClipboardList,
  RefreshCw,
  User,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OperationStatusBadge, type OperationStatus } from './OperationStatusBadge'
import { formatDuration } from './DurationDisplay'

export interface WOOperation {
  id: string
  sequence: number
  operation_name: string
  status: OperationStatus
  started_at: string | null
  completed_at: string | null
  expected_duration_minutes: number | null
  actual_duration_minutes: number | null
  actual_yield_percent: number | null
  started_by_user?: {
    first_name: string | null
    last_name: string | null
  } | null
}

export interface OperationsTimelineProps {
  /** Array of operations */
  operations: WOOperation[]
  /** Callback when operation is selected */
  onOperationSelect?: (op: WOOperation) => void
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: string | null
  /** Retry callback for error state */
  onRetry?: () => void
  /** Whether sequence is required */
  sequenceRequired?: boolean
}

const STATUS_COLORS: Record<OperationStatus, { bg: string; border: string; text: string }> = {
  pending: { bg: 'bg-gray-200', border: 'border-gray-300', text: 'text-gray-600' },
  in_progress: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  completed: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
  skipped: { bg: 'bg-orange-400', border: 'border-orange-500', text: 'text-white' },
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getUserName(
  user: { first_name: string | null; last_name: string | null } | null | undefined
): string {
  if (!user) return '-'
  const first = user.first_name || ''
  const last = user.last_name || ''
  if (first && last) return `${first} ${last}`
  return first || last || '-'
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Operation Timeline
        </CardTitle>
      </CardHeader>
      <CardContent
        className="space-y-4"
        aria-busy="true"
        aria-label="Loading operations"
      >
        {/* Legend skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Timeline skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 flex-1 min-w-[80px] rounded-lg" />
          ))}
        </div>

        {/* Progress bar skeleton */}
        <Skeleton className="h-1 w-full" />
      </CardContent>
    </Card>
  )
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Operation Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ClipboardList className="h-12 w-12 text-gray-400 mb-3" />
          <h3 className="font-medium text-lg mb-1">No operations defined</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            This work order routing has no operations to track.
            Operations are defined in the product routing.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error state
 */
function ErrorState({
  error,
  onRetry,
}: {
  error: string
  onRetry?: () => void
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operation Timeline
          </CardTitle>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
          <h3 className="font-medium text-lg mb-1">Failed to load operations</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {error}
          </p>
          {onRetry && (
            <Button variant="outline" className="mt-4" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Legend component
 */
function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-sm" aria-label="Status legend">
      {Object.entries(STATUS_COLORS).map(([status, config]) => (
        <div key={status} className="flex items-center gap-2">
          <div className={cn('w-4 h-4 rounded', config.bg)} aria-hidden="true" />
          <span className="text-muted-foreground capitalize">
            {status.replace('_', ' ')}
          </span>
        </div>
      ))}
    </div>
  )
}

export function OperationsTimeline({
  operations,
  onOperationSelect,
  isLoading = false,
  error = null,
  onRetry,
  sequenceRequired = false,
}: OperationsTimelineProps) {
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  // Empty state
  if (operations.length === 0) {
    return <EmptyState />
  }

  // Calculate progress
  const completedCount = operations.filter(
    (op) => op.status === 'completed' || op.status === 'skipped'
  ).length
  const progressPercent = (completedCount / operations.length) * 100

  // Calculate total expected duration for scaling
  const totalExpectedDuration = operations.reduce(
    (sum, op) => sum + (op.expected_duration_minutes || 30),
    0
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Operation Timeline
          {sequenceRequired && (
            <span className="text-xs font-normal text-muted-foreground ml-2">
              (Sequence Required)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <Legend />

        {/* Timeline */}
        <div
          className={cn(
            'relative pb-4',
            isMobile ? 'space-y-2' : 'overflow-x-auto'
          )}
        >
          <div
            className={cn(
              'gap-1',
              isMobile ? 'flex flex-col' : 'flex min-w-max'
            )}
          >
            {operations.map((op) => {
              const config = STATUS_COLORS[op.status] || STATUS_COLORS.pending
              const duration =
                op.actual_duration_minutes ||
                op.expected_duration_minutes ||
                30
              const widthPercent = Math.max(
                10,
                (duration / totalExpectedDuration) * 100
              )
              const operatorName = getUserName(op.started_by_user)

              return (
                <Popover
                  key={op.id}
                  open={selectedOpId === op.id}
                  onOpenChange={(open) => setSelectedOpId(open ? op.id : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        'relative rounded-lg border-2 transition-all',
                        'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                        config.bg,
                        config.border,
                        isMobile ? 'h-16 w-full' : 'h-16'
                      )}
                      style={
                        isMobile
                          ? undefined
                          : { minWidth: `${Math.max(80, widthPercent * 3)}px` }
                      }
                      onClick={() => onOperationSelect?.(op)}
                      aria-label={`Operation ${op.operation_name}, status ${op.status}, duration ${formatDuration(duration)}`}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                        <span
                          className={cn(
                            'text-xs font-medium truncate max-w-full',
                            config.text
                          )}
                        >
                          {op.sequence}. {op.operation_name}
                        </span>
                        <span
                          className={cn(
                            'text-xs',
                            op.status === 'pending'
                              ? 'text-gray-500'
                              : 'text-white/80'
                          )}
                        >
                          {formatDuration(duration)}
                          {op.status === 'completed' &&
                            op.actual_yield_percent !== null && (
                              <span className="ml-1">
                                {op.actual_yield_percent.toFixed(0)}%
                              </span>
                            )}
                        </span>
                      </div>

                      {/* Animated indicator for in_progress */}
                      {op.status === 'in_progress' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-300 animate-pulse rounded-b" />
                      )}
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="w-72" align="start">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold">{op.operation_name}</h4>
                        <OperationStatusBadge status={op.status} size="sm" />
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">Started:</span>{' '}
                            <span className="font-medium">
                              {formatDateTime(op.started_at)}
                            </span>
                          </div>
                        </div>

                        {op.completed_at && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">
                                Completed:
                              </span>{' '}
                              <span className="font-medium">
                                {formatDateTime(op.completed_at)}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">
                              Duration:
                            </span>{' '}
                            <span className="font-medium">
                              {formatDuration(op.actual_duration_minutes)} /{' '}
                              {formatDuration(op.expected_duration_minutes)}{' '}
                              expected
                            </span>
                          </div>
                        </div>

                        {op.started_by_user && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">
                                Operator:
                              </span>{' '}
                              <span className="font-medium">{operatorName}</span>
                            </div>
                          </div>
                        )}

                        {op.actual_yield_percent !== null && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">Yield:</span>{' '}
                              <span className="font-medium">
                                {op.actual_yield_percent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${completedCount} of ${operations.length} operations completed`}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Start</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Total: {formatDuration(totalExpectedDuration)}
            </span>
            <span>End</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OperationsTimeline
