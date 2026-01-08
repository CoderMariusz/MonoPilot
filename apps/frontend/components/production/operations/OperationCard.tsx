'use client'

/**
 * OperationCard Component
 * Story: 04.3 - Operation Start/Complete
 *
 * Single operation card displaying status, machine, durations, and action buttons.
 * Includes all states: pending (can start), pending (blocked), in_progress, completed, skipped.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { PlayCircle, CheckCircle2, Clock, User, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OperationStatusBadge, type OperationStatus } from './OperationStatusBadge'
import { DurationDisplay, formatDuration } from './DurationDisplay'

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
  machine_name?: string | null
  started_by_user?: {
    first_name: string | null
    last_name: string | null
  } | null
  completed_by_user?: {
    first_name: string | null
    last_name: string | null
  } | null
}

export interface OperationCardProps {
  /** Operation data */
  operation: WOOperation
  /** Can start this operation (sequence requirements met) */
  canStart: boolean
  /** Can complete this operation (is in_progress) */
  canComplete: boolean
  /** Callback when Start button clicked */
  onStart: () => void
  /** Callback when Complete button clicked */
  onComplete: () => void
  /** Callback when card body clicked (for details) */
  onClick?: () => void
  /** Is sequence blocked (previous op not done) */
  sequenceBlocked?: boolean
  /** Reason for sequence block */
  sequenceBlockReason?: string
}

function getUserName(
  user: { first_name: string | null; last_name: string | null } | null | undefined
): string {
  if (!user) return ''
  const first = user.first_name || ''
  const last = user.last_name || ''
  if (first && last) return `${first} ${last.charAt(0)}.`
  return first || last || ''
}

function formatTime(dateString: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OperationCard({
  operation,
  canStart,
  canComplete,
  onStart,
  onComplete,
  onClick,
  sequenceBlocked = false,
  sequenceBlockReason,
}: OperationCardProps) {
  const isPending = operation.status === 'pending'
  const isInProgress = operation.status === 'in_progress'
  const isCompleted = operation.status === 'completed'
  const isSkipped = operation.status === 'skipped'
  const isFinalized = isCompleted || isSkipped

  // Card border color based on status
  const borderColor = isInProgress
    ? 'border-blue-300'
    : isCompleted
      ? 'border-green-300'
      : isSkipped
        ? 'border-orange-300'
        : ''

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    onClick?.()
  }

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onClick) {
      onClick()
    }
  }

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'transition-all hover:shadow-md',
          borderColor,
          onClick && 'cursor-pointer',
          isInProgress && 'ring-1 ring-blue-200'
        )}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? 'button' : undefined}
        aria-label={`Operation ${operation.sequence}: ${operation.operation_name}, status ${operation.status}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left section: Sequence number, name, details */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Sequence number badge */}
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {operation.sequence}
              </div>

              {/* Operation details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base truncate">
                    {operation.operation_name}
                  </h3>
                  <OperationStatusBadge status={operation.status} size="sm" />
                </div>

                {/* Machine info */}
                {operation.machine_name && (
                  <p className="text-sm text-muted-foreground">
                    Machine: {operation.machine_name}
                  </p>
                )}

                {/* Duration info */}
                {isPending && operation.expected_duration_minutes && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Expected: {formatDuration(operation.expected_duration_minutes)}
                  </p>
                )}

                {isInProgress && (
                  <div className="space-y-1">
                    {operation.started_at && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Started: {formatTime(operation.started_at)}
                        {getUserName(operation.started_by_user) && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getUserName(operation.started_by_user)}
                          </span>
                        )}
                      </p>
                    )}
                    <DurationDisplay
                      expected={operation.expected_duration_minutes}
                      actual={operation.actual_duration_minutes}
                      size="sm"
                    />
                  </div>
                )}

                {isCompleted && (
                  <div className="space-y-1">
                    <DurationDisplay
                      expected={operation.expected_duration_minutes}
                      actual={operation.actual_duration_minutes}
                      size="sm"
                    />
                    {operation.actual_yield_percent !== null && (
                      <p className="text-sm">
                        Yield:{' '}
                        <span
                          className={cn(
                            'font-medium',
                            operation.actual_yield_percent >= 95
                              ? 'text-green-600'
                              : operation.actual_yield_percent >= 85
                                ? 'text-blue-600'
                                : operation.actual_yield_percent >= 70
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                          )}
                        >
                          {operation.actual_yield_percent.toFixed(1)}%
                        </span>
                      </p>
                    )}
                    {operation.completed_at && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Completed: {formatTime(operation.completed_at)}
                        {getUserName(operation.completed_by_user) && (
                          <span className="flex items-center gap-1">
                            by {getUserName(operation.completed_by_user)}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {/* Sequence blocked warning */}
                {sequenceBlocked && sequenceBlockReason && (
                  <p className="text-sm text-yellow-600 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {sequenceBlockReason}
                  </p>
                )}
              </div>
            </div>

            {/* Right section: Action buttons */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {/* Start button */}
              {isPending && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onStart()
                        }}
                        disabled={!canStart}
                        className={cn(
                          'gap-1 min-w-[90px] min-h-[36px]',
                          !canStart && 'cursor-not-allowed opacity-50'
                        )}
                        aria-describedby={
                          sequenceBlocked ? 'sequence-block-reason' : undefined
                        }
                      >
                        <PlayCircle className="h-4 w-4" />
                        Start
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {sequenceBlocked && sequenceBlockReason && (
                    <TooltipContent id="sequence-block-reason" side="left">
                      <p>{sequenceBlockReason}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}

              {/* Complete button */}
              {isInProgress && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onComplete()
                  }}
                  disabled={!canComplete}
                  className="gap-1 min-w-[90px] min-h-[36px] bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Complete
                </Button>
              )}

              {/* View details for completed/skipped */}
              {isFinalized && onClick && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClick()
                  }}
                  className="gap-1 min-w-[90px] min-h-[36px]"
                >
                  <Info className="h-4 w-4" />
                  Details
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

export default OperationCard
