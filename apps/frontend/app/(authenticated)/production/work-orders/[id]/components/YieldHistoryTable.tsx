'use client'

/**
 * YieldHistoryTable Component
 * Story: 04.4 - Yield Tracking
 *
 * Table showing all yield update history with audit trail.
 * Displays timestamp, user, quantity changes, yield percentage change, and notes.
 * Always sorted by timestamp DESC (newest first).
 *
 * AC-5: Yield History Tracking
 */

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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { History, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface YieldLogEntry {
  id: string
  timestamp: string
  user_name: string
  old_quantity: number
  new_quantity: number
  old_yield_percent: number
  new_yield_percent: number
  notes?: string | null
}

export interface YieldHistoryTableProps {
  /** Work Order ID */
  woId: string
  /** Unit of measure */
  uom?: string
  /** Rows per page (default 10) */
  limit?: number
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Data from parent (if pre-fetched) */
  data?: YieldLogEntry[]
  /** Callback to retry loading */
  onRetry?: () => void
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): { date: string; time: string } {
  const date = new Date(timestamp)
  return {
    date: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

/**
 * Format yield change display
 */
function formatYieldChange(oldPercent: number, newPercent: number): string {
  return `${oldPercent.toFixed(1)}% → ${newPercent.toFixed(1)}%`
}

/**
 * Loading skeleton for YieldHistoryTable
 */
export function YieldHistoryTableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Yield Update History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="w-24">Old Qty</TableHead>
                <TableHead className="w-24">New Qty</TableHead>
                <TableHead className="w-28">Yield Change</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Empty state when no history
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <History className="h-12 w-12 text-muted-foreground mb-3" />
      <h3 className="font-medium text-base mb-1">No yield updates recorded</h3>
      <p className="text-sm text-muted-foreground">
        Yield history will appear here after the first update.
      </p>
    </div>
  )
}

/**
 * Error state with retry
 */
function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-3" />
      <h3 className="font-medium text-base mb-1">Failed to Load Yield History</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}

/**
 * Mobile card view for yield history entry
 */
function MobileHistoryCard({
  entry,
  uom,
}: {
  entry: YieldLogEntry
  uom: string
}) {
  const { date, time } = formatTimestamp(entry.timestamp)

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">{date}</p>
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
        <span className="text-sm">{entry.user_name}</span>
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">Quantity: </span>
        <span>
          {entry.old_quantity.toLocaleString()} → {entry.new_quantity.toLocaleString()} {uom}
        </span>
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">Yield: </span>
        <span>{formatYieldChange(entry.old_yield_percent, entry.new_yield_percent)}</span>
      </div>
      {entry.notes && (
        <div className="text-sm">
          <span className="text-muted-foreground">Note: </span>
          <span>{entry.notes}</span>
        </div>
      )}
    </div>
  )
}

export function YieldHistoryTable({
  woId,
  uom = 'units',
  limit = 10,
  isLoading = false,
  error = null,
  data,
  onRetry,
}: YieldHistoryTableProps) {
  const [entries, setEntries] = useState<YieldLogEntry[]>(data || [])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(!data && isLoading)
  const [errorMsg, setErrorMsg] = useState<string | null>(error)

  const fetchHistory = useCallback(async () => {
    if (data) return // Skip if data is provided from parent

    setLoading(true)
    setErrorMsg(null)

    try {
      const response = await fetch(`/api/production/work-orders/${woId}/yield/history`)
      if (!response.ok) {
        throw new Error('Failed to load yield history')
      }
      const result = await response.json()
      const logs = result.data?.logs || []
      setEntries(
        (logs || []).map((log: {
          id: string
          created_at: string
          user_name?: string
          old_quantity: number
          new_quantity: number
          old_yield_percent: number
          new_yield_percent: number
          notes?: string | null
        }) => ({
          id: log.id,
          timestamp: log.created_at,
          user_name: log.user_name || 'Unknown',
          old_quantity: log.old_quantity,
          new_quantity: log.new_quantity,
          old_yield_percent: log.old_yield_percent,
          new_yield_percent: log.new_yield_percent,
          notes: log.notes,
        }))
      )
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [woId, data])

  useEffect(() => {
    if (!data) {
      fetchHistory()
    }
  }, [fetchHistory, data])

  // Update entries when data prop changes
  useEffect(() => {
    if (data) {
      setEntries(data)
    }
  }, [data])

  const handleRetry = () => {
    fetchHistory()
    onRetry?.()
  }

  // Pagination
  const totalPages = Math.ceil(entries.length / limit)
  const paginatedEntries = entries.slice((page - 1) * limit, page * limit)
  const showingStart = entries.length === 0 ? 0 : (page - 1) * limit + 1
  const showingEnd = Math.min(page * limit, entries.length)

  if (loading || isLoading) {
    return <YieldHistoryTableSkeleton />
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Yield Update History</CardTitle>
      </CardHeader>
      <CardContent>
        {errorMsg ? (
          <ErrorState message={errorMsg} onRetry={handleRetry} />
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="w-24 text-right">Old Qty</TableHead>
                    <TableHead className="w-24 text-right">New Qty</TableHead>
                    <TableHead className="w-28">Yield Change</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map((entry) => {
                    const { date, time } = formatTimestamp(entry.timestamp)
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="font-medium">{date}</div>
                          <div className="text-xs text-muted-foreground">{time}</div>
                        </TableCell>
                        <TableCell>{entry.user_name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.old_quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.new_quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatYieldChange(entry.old_yield_percent, entry.new_yield_percent)}
                        </TableCell>
                        <TableCell className="max-w-48 truncate" title={entry.notes || ''}>
                          {entry.notes || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {paginatedEntries.map((entry) => (
                <MobileHistoryCard key={entry.id} entry={entry} uom={uom} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {showingStart} to {showingEnd} of {entries.length} entries
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-2 text-sm">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default YieldHistoryTable
