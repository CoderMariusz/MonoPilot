'use client'

/**
 * WOPauseHistory Component
 * Story: 04.2b - WO Pause/Resume
 *
 * A table/list component displaying the complete pause history for a work order.
 * Shows all pause events with reason, duration, and user information.
 * Can be embedded in the WO Detail page or shown in a modal.
 *
 * States:
 * - Loading: Skeleton rows
 * - Empty: "No pauses recorded" message
 * - Error: Error with retry button
 * - Success: Table/list of pause records
 */

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPauseReasonIcon, getPauseReasonLabel } from './PauseReasonSelect'
import type { PauseReason } from '@/lib/validation/production-schemas'

/**
 * Pause history record
 */
export interface WOPauseHistoryRecord {
  id: string
  work_order_id: string
  paused_at: string
  resumed_at: string | null
  duration_minutes: number | null
  pause_reason: PauseReason | null
  pause_reason_label?: string
  notes: string | null
  paused_by_user?: {
    id: string
    full_name: string
  }
  resumed_by_user?: {
    id: string
    full_name: string
  } | null
}

/**
 * Pause summary
 */
export interface PauseSummary {
  total_count: number
  total_duration_minutes: number
  average_duration_minutes: number
  top_reason?: {
    reason: PauseReason
    label: string
    total_minutes: number
  }
}

export interface WOPauseHistoryProps {
  workOrderId: string
  pauses?: WOPauseHistoryRecord[]
  maxItems?: number
  showSummary?: boolean
  variant?: 'table' | 'list'
  className?: string
}

/**
 * Get pause reason label - wrapper for null handling
 */
function getReasonLabel(reason: PauseReason | null): string {
  if (!reason) return 'Unspecified'
  return getPauseReasonLabel(reason)
}

/**
 * Format duration
 */
function formatDuration(minutes: number | null): string {
  if (minutes === null) return '[Active]'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format date/time
 */
function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Loading skeleton
 */
export function WOPauseHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
      <h3 className="font-medium text-lg mb-1">No pauses recorded</h3>
      <p className="text-sm text-muted-foreground">This work order has not been paused.</p>
    </div>
  )
}

/**
 * Error state
 */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-3" />
      <h3 className="font-medium text-lg mb-1">Failed to load pause history</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}

/**
 * Summary section
 */
function SummarySection({ summary }: { summary: PauseSummary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg mb-4">
      <div>
        <div className="text-xs text-muted-foreground">Total Pauses</div>
        <div className="text-lg font-semibold">{summary.total_count}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Total Downtime</div>
        <div className="text-lg font-semibold">{formatDuration(summary.total_duration_minutes)}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Average Pause</div>
        <div className="text-lg font-semibold">{formatDuration(Math.round(summary.average_duration_minutes))}</div>
      </div>
      {summary.top_reason && (
        <div>
          <div className="text-xs text-muted-foreground">Top Reason</div>
          <div className="text-lg font-semibold truncate">{summary.top_reason.label}</div>
        </div>
      )}
    </div>
  )
}

/**
 * Mobile card view for a single pause record
 */
function PauseCard({ pause }: { pause: WOPauseHistoryRecord }) {
  const { icon: ReasonIcon, color } = getPauseReasonIcon(pause.pause_reason)
  const isActive = pause.resumed_at === null

  return (
    <Card className={cn('mb-3', isActive && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20')}>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <ReasonIcon className={cn('h-4 w-4', color)} />
            <span className="font-medium">{getReasonLabel(pause.pause_reason)}</span>
          </div>
          <div className="text-right">
            {isActive ? (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                Currently Paused
              </Badge>
            ) : (
              <span className="font-semibold">{formatDuration(pause.duration_minutes)}</span>
            )}
          </div>
        </div>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <dt>Paused:</dt>
            <dd>{formatDateTime(pause.paused_at)}</dd>
          </div>
          {pause.resumed_at && (
            <div className="flex justify-between text-muted-foreground">
              <dt>Resumed:</dt>
              <dd>{formatDateTime(pause.resumed_at)}</dd>
            </div>
          )}
          {pause.paused_by_user && (
            <div className="flex justify-between text-muted-foreground">
              <dt>By:</dt>
              <dd>{pause.paused_by_user.full_name}</dd>
            </div>
          )}
          {pause.notes && (
            <div className="pt-2 text-muted-foreground">
              <dt className="text-xs">Notes:</dt>
              <dd className="truncate" title={pause.notes}>
                {pause.notes}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}

export function WOPauseHistory({
  workOrderId,
  pauses: initialPauses,
  maxItems,
  showSummary = true,
  variant = 'table',
  className,
}: WOPauseHistoryProps) {
  const [pauses, setPauses] = useState<WOPauseHistoryRecord[]>(initialPauses || [])
  const [summary, setSummary] = useState<PauseSummary | null>(null)
  const [isLoading, setIsLoading] = useState(!initialPauses)
  const [error, setError] = useState<string | null>(null)

  // Fetch pause history
  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/production/work-orders/${workOrderId}/pause-history`)
      if (!response.ok) {
        throw new Error('Failed to load pause history')
      }

      const result = await response.json()
      const data = result.data || result

      // Map the response to our expected format
      const mappedPauses: WOPauseHistoryRecord[] = (data.pauses || data || []).map(
        (p: {
          id: string
          wo_id?: string
          work_order_id?: string
          paused_at: string
          resumed_at: string | null
          duration_minutes: number | null
          reason?: string
          pause_reason?: PauseReason | null
          notes: string | null
          paused_by_user_id?: string
          resumed_by_user_id?: string
          paused_by_user?: { id: string; first_name: string | null; last_name: string | null }
          resumed_by_user?: { id: string; first_name: string | null; last_name: string | null } | null
        }) => ({
          id: p.id,
          work_order_id: p.wo_id || p.work_order_id || workOrderId,
          paused_at: p.paused_at,
          resumed_at: p.resumed_at,
          duration_minutes: p.duration_minutes,
          pause_reason: (p.reason || p.pause_reason) as PauseReason | null,
          notes: p.notes,
          paused_by_user: p.paused_by_user
            ? {
                id: p.paused_by_user.id,
                full_name: [p.paused_by_user.first_name, p.paused_by_user.last_name]
                  .filter(Boolean)
                  .join(' ') || 'Unknown',
              }
            : undefined,
          resumed_by_user: p.resumed_by_user
            ? {
                id: p.resumed_by_user.id,
                full_name: [p.resumed_by_user.first_name, p.resumed_by_user.last_name]
                  .filter(Boolean)
                  .join(' ') || 'Unknown',
              }
            : null,
        })
      )

      setPauses(mappedPauses)

      // Calculate summary
      if (showSummary && mappedPauses.length > 0) {
        const completedPauses = mappedPauses.filter((p) => p.duration_minutes !== null)
        const totalMinutes = completedPauses.reduce((sum, p) => sum + (p.duration_minutes || 0), 0)

        // Count by reason
        const byReason: Record<string, number> = {}
        for (const p of completedPauses) {
          const reason = p.pause_reason || 'other'
          byReason[reason] = (byReason[reason] || 0) + (p.duration_minutes || 0)
        }

        // Find top reason
        let topReason: PauseSummary['top_reason'] | undefined
        if (Object.keys(byReason).length > 0) {
          const sorted = Object.entries(byReason).sort(([, a], [, b]) => b - a)
          if (sorted[0]) {
            topReason = {
              reason: sorted[0][0] as PauseReason,
              label: getReasonLabel(sorted[0][0] as PauseReason),
              total_minutes: sorted[0][1],
            }
          }
        }

        setSummary({
          total_count: mappedPauses.length,
          total_duration_minutes: totalMinutes,
          average_duration_minutes:
            completedPauses.length > 0 ? totalMinutes / completedPauses.length : 0,
          top_reason: topReason,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pause history')
    } finally {
      setIsLoading(false)
    }
  }, [workOrderId, showSummary])

  // Initial fetch if no data provided
  useEffect(() => {
    if (!initialPauses) {
      fetchHistory()
    }
  }, [initialPauses, fetchHistory])

  // Update from props and calculate summary
  useEffect(() => {
    if (initialPauses) {
      setPauses(initialPauses)

      // Calculate summary for provided pauses
      if (showSummary && initialPauses.length > 0) {
        const completedPauses = initialPauses.filter((p) => p.duration_minutes !== null)
        const totalMinutes = completedPauses.reduce((sum, p) => sum + (p.duration_minutes || 0), 0)

        // Count by reason
        const byReason: Record<string, number> = {}
        for (const p of completedPauses) {
          const reason = p.pause_reason || 'other'
          byReason[reason] = (byReason[reason] || 0) + (p.duration_minutes || 0)
        }

        // Find top reason
        let topReason: PauseSummary['top_reason'] | undefined
        if (Object.keys(byReason).length > 0) {
          const sorted = Object.entries(byReason).sort(([, a], [, b]) => b - a)
          if (sorted[0]) {
            topReason = {
              reason: sorted[0][0] as PauseReason,
              label: getReasonLabel(sorted[0][0] as PauseReason),
              total_minutes: sorted[0][1],
            }
          }
        }

        setSummary({
          total_count: initialPauses.length,
          total_duration_minutes: totalMinutes,
          average_duration_minutes:
            completedPauses.length > 0 ? totalMinutes / completedPauses.length : 0,
          top_reason: topReason,
        })
      }
    }
  }, [initialPauses, showSummary])

  // Apply maxItems limit
  const displayedPauses = maxItems ? pauses.slice(0, maxItems) : pauses

  if (isLoading) {
    return <WOPauseHistorySkeleton />
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Pause History</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message={error} onRetry={fetchHistory} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Pause History</CardTitle>
        {summary && summary.total_count > 0 && (
          <span className="text-sm text-muted-foreground">
            Total: {formatDuration(summary.total_duration_minutes)}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {showSummary && summary && summary.total_count > 0 && <SummarySection summary={summary} />}

        {displayedPauses.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Paused At</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedPauses.map((pause, index) => {
                    const { icon: ReasonIcon, color } = getPauseReasonIcon(pause.pause_reason)
                    const isActive = pause.resumed_at === null

                    return (
                      <TableRow
                        key={pause.id}
                        className={cn(isActive && 'bg-yellow-50 dark:bg-yellow-950/20')}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDateTime(pause.paused_at)}
                          </div>
                          {pause.resumed_at && (
                            <div className="text-xs text-muted-foreground">
                              Resumed: {formatDateTime(pause.resumed_at)}
                            </div>
                          )}
                          {isActive && (
                            <div className="text-xs text-yellow-600">Still paused</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-800 border-yellow-300"
                            >
                              Active
                            </Badge>
                          ) : (
                            formatDuration(pause.duration_minutes)
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ReasonIcon className={cn('h-4 w-4', color)} />
                            <span>{getReasonLabel(pause.pause_reason)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {pause.paused_by_user?.full_name || '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          {pause.notes ? (
                            <span className="truncate block" title={pause.notes}>
                              {pause.notes}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {displayedPauses.map((pause) => (
                <PauseCard key={pause.id} pause={pause} />
              ))}
            </div>
          </>
        )}

        {maxItems && pauses.length > maxItems && (
          <div className="text-center mt-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View all {pauses.length} pauses
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WOPauseHistory
