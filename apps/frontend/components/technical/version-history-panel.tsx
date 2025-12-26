/**
 * VersionHistoryPanel Component (Story 02.2)
 * Side panel showing product version history timeline
 *
 * Features:
 * - Slides in from right (400px width)
 * - Displays version timeline with user, timestamp, and changes
 * - "Initial creation" for version 1
 * - Expandable "View Details" for full JSONB diff
 * - Loading, error, and empty states
 * - Pagination support
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { ProductHistoryService } from '@/lib/services/product-history-service'
import type { VersionHistoryItem } from '@/lib/types/product-history'
import { VersionBadge } from './version-badge'
import { VersionDiff } from './version-diff'
import { cn } from '@/lib/utils'

interface VersionHistoryPanelProps {
  productId: string
  open: boolean
  onClose: () => void
}

/**
 * Format timestamp to readable format
 * e.g., "2025-01-03T10:30:00Z" → "Jan 3, 2025 10:30 AM"
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format field changes into summary text
 * e.g., "name, std_price"
 */
function getChangeSummary(changedFields: Record<string, { old: unknown; new: unknown }>): string {
  const fields = Object.keys(changedFields).filter((key) => key !== '_initial')
  if (fields.length === 0) return ''
  return fields.join(', ')
}

interface VersionItemProps {
  item: VersionHistoryItem
}

function VersionItem({ item }: VersionItemProps) {
  const [expanded, setExpanded] = useState(false)
  const isInitial = item.is_initial || '_initial' in item.changed_fields

  return (
    <div className="border-b border-border pb-4 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <VersionBadge version={item.version} size="sm" />
          {item.version === 1 && (
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(item.changed_at)}
            </span>
          )}
        </div>
      </div>

      {item.version > 1 && (
        <div className="text-xs text-muted-foreground mb-1">
          {formatTimestamp(item.changed_at)}
        </div>
      )}

      <div className="text-sm mb-2">
        <span className="font-medium">{item.changed_by.name}</span>
      </div>

      {isInitial ? (
        <div className="text-sm text-muted-foreground">Initial creation</div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-2">
            Changed: {getChangeSummary(item.changed_fields)}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-auto p-1 text-xs"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                View Details
              </>
            )}
          </Button>

          {expanded && (
            <div className="mt-3 p-3 bg-muted rounded-md">
              <VersionDiff changedFields={item.changed_fields} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function VersionHistoryPanel({ productId, open, onClose }: VersionHistoryPanelProps) {
  const [history, setHistory] = useState<VersionHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (open && productId) {
      fetchHistory()
    }
  }, [open, productId])

  const fetchHistory = async (pageNum: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const response = await ProductHistoryService.getVersionHistory(productId, {
        page: pageNum,
        limit: 20,
      })

      if (pageNum === 1) {
        setHistory(response.history)
      } else {
        setHistory((prev) => [...prev, ...response.history])
      }

      setTotal(response.total)
      setHasMore(response.has_more)
      setPage(pageNum)
    } catch (err) {
      console.error('Error fetching version history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchHistory(page + 1)
    }
  }

  const handleRetry = () => {
    setHistory([])
    setPage(1)
    fetchHistory(1)
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[400px] overflow-y-auto"
        aria-label="Version history panel"
      >
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
          <SheetDescription>View all changes made to this product</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Loading State */}
          {loading && history.length === 0 && (
            <div className="flex items-center justify-center py-8" role="status">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading history...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="mb-2">{error}</div>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Empty State */}
          {!loading && !error && history.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No version history found</p>
            </div>
          )}

          {/* History List */}
          {!error && history.length > 0 && (
            <>
              <div className="space-y-4">
                {history.map((item) => (
                  <VersionItem key={item.id} item={item} />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}

              {/* Total Count */}
              {total > 0 && (
                <div className="text-xs text-center text-muted-foreground pt-2">
                  Showing {history.length} of {total} versions
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
