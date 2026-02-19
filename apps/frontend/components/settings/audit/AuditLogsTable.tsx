/**
 * AuditLogsTable Component
 * Story: 01.17 - Audit Trail
 *
 * DataTable with infinite scroll (100 per load)
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { AuditLogRow } from './AuditLogRow'
import { AuditLogEmptyState } from './AuditLogEmptyState'
import type { AuditLog } from '@/lib/types/audit-log'

interface AuditLogsTableProps {
  logs: AuditLog[]
  total: number
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: Error | null
  onLoadMore: () => void
  hasFilters: boolean
  onClearFilters: () => void
}

export function AuditLogsTable({
  logs,
  total,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  error,
  onLoadMore,
  hasFilters,
  onClearFilters,
}: AuditLogsTableProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        onLoadMore()
      }
    },
    [hasNextPage, isFetchingNextPage, onLoadMore]
  )

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [handleObserver])

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="audit-loading-skeleton">
        <div className="space-y-4">
          <div className="border rounded-md">
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Failed to load audit logs</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (logs.length === 0) {
    return <AuditLogEmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
  }

  return (
    <div data-testid="audit-logs-table">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Action</TableHead>
              <TableHead className="w-[200px]">User</TableHead>
              <TableHead className="w-[180px]">Entity</TableHead>
              <TableHead className="w-[140px]">Timestamp</TableHead>
              <TableHead className="w-[100px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Skeleton className="h-4 w-4 rounded-full" />
            <span className="text-sm">Loading more...</span>
          </div>
        ) : hasNextPage ? (
          <span className="text-sm text-muted-foreground">
            Showing {logs.length} of {total} records
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            Showing all {total} records
          </span>
        )}
      </div>
    </div>
  )
}
