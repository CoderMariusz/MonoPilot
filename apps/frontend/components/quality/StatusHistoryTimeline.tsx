'use client'

/**
 * StatusHistoryTimeline Component
 * Story: 06.1 - Quality Status Types
 *
 * Displays status change history in a timeline visualization.
 * Shows chronological status transitions with:
 * - Status badges (from -> to)
 * - User who made the change
 * - Timestamp (relative and absolute)
 * - Reason for change
 * - Expandable details
 *
 * States:
 * - Loading: Shows skeleton placeholders
 * - Empty: No history available
 * - Error: Failed to load with retry option
 * - Success: Timeline with entries
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
 */

import { memo, useState, useMemo, useCallback } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  User,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { QualityStatusBadge, type QualityStatus } from './QualityStatusBadge'

// ============================================================================
// Types
// ============================================================================

export interface TimelineUser {
  id: string
  name: string
  email?: string
  avatar_url?: string
}

export interface StatusHistoryEntry {
  id: string
  from_status: QualityStatus | null
  to_status: QualityStatus
  reason: string | null
  changed_by: string
  changed_by_name: string
  changed_by_user?: TimelineUser | null
  changed_at: string
}

export interface StatusHistoryTimelineProps {
  /** History entries */
  entries: StatusHistoryEntry[]
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string | null
  /** Enable expandable entries */
  expandable?: boolean
  /** Maximum entries to show before "View more" */
  maxEntries?: number
  /** Retry callback for error state */
  onRetry?: () => void
  /** Additional CSS classes */
  className?: string
  /** Test ID for testing */
  testId?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function formatTimestamp(dateStr: string, full = false): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (full) {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    })
  }

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusDotColor(status: QualityStatus): string {
  const colorMap: Record<QualityStatus, string> = {
    PENDING: 'bg-gray-500',
    PASSED: 'bg-green-500',
    FAILED: 'bg-red-500',
    HOLD: 'bg-orange-500',
    RELEASED: 'bg-blue-500',
    QUARANTINED: 'bg-red-700',
    COND_APPROVED: 'bg-yellow-500',
  }
  return colorMap[status] || 'bg-gray-500'
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// ============================================================================
// Sub-Components
// ============================================================================

function TimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      className="space-y-6"
      aria-label="Loading history"
      role="status"
      data-testid="timeline-loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TimelineEmpty() {
  return (
    <div
      className="text-center py-12 text-muted-foreground"
      role="status"
      aria-label="No status history available"
      data-testid="timeline-empty"
    >
      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium">No status history available</p>
      <p className="text-sm">Status changes will appear here</p>
    </div>
  )
}

function TimelineError({
  error,
  onRetry,
}: {
  error: string
  onRetry?: () => void
}) {
  return (
    <div
      className="text-center py-12"
      role="alert"
      aria-label={`Error: ${error}`}
      data-testid="timeline-error"
    >
      <div className="text-red-500 mb-4">
        <Clock className="h-12 w-12 mx-auto opacity-50" />
      </div>
      <p className="text-lg font-medium text-red-600">{error}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4"
          data-testid="timeline-retry-button"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  )
}

function UserAvatar({
  user,
  name,
  size = 'md',
}: {
  user?: TimelineUser | null
  name: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  }

  if (user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className={sizeClasses[size]}>
              {user.avatar_url && (
                <AvatarImage src={user.avatar_url} alt={user.name} />
              )}
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">{user.name}</p>
              {user.email && (
                <p className="text-muted-foreground">{user.email}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarFallback className="bg-gray-100 text-gray-600">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

const TimelineEntryItem = memo(function TimelineEntryItem({
  entry,
  isFirst,
  isLast,
  expandable,
}: {
  entry: StatusHistoryEntry
  isFirst: boolean
  isLast: boolean
  expandable: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isCreation = entry.from_status === null
  const hasReason = entry.reason && entry.reason.trim().length > 0
  const dotColorClass = getStatusDotColor(entry.to_status)

  return (
    <div
      className={cn(
        'relative flex gap-4 pb-6',
        !isLast && 'border-l-2 border-gray-200 ml-[19px] pl-6'
      )}
      role="listitem"
      aria-label={`Status changed to ${entry.to_status} on ${formatTimestamp(entry.changed_at)}`}
      data-testid={`timeline-entry-${entry.id}`}
    >
      {/* Timeline Dot */}
      <div
        className={cn(
          'absolute left-0 -translate-x-1/2 flex items-center justify-center',
          'h-10 w-10 rounded-full border-4 border-white shadow-sm',
          isFirst ? dotColorClass : 'bg-white border-gray-200'
        )}
        style={{ marginLeft: isLast ? 0 : '-1px' }}
      >
        {isFirst ? (
          <div className="h-3 w-3 rounded-full bg-white" />
        ) : (
          <div className={cn('h-3 w-3 rounded-full', dotColorClass)} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Status Transition */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {isCreation ? (
            <>
              <span className="text-sm text-muted-foreground">Created as</span>
              <QualityStatusBadge status={entry.to_status} size="sm" />
            </>
          ) : (
            <>
              {entry.from_status && (
                <QualityStatusBadge status={entry.from_status} size="sm" />
              )}
              <ArrowRight
                className="h-4 w-4 text-muted-foreground flex-shrink-0"
                aria-hidden="true"
              />
              <QualityStatusBadge status={entry.to_status} size="sm" />
            </>
          )}
        </div>

        {/* User and Timestamp */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="flex items-center gap-2">
            <UserAvatar
              user={entry.changed_by_user}
              name={entry.changed_by_name}
              size="sm"
            />
            <span className="font-medium text-gray-700">
              {entry.changed_by_name}
            </span>
          </span>
          <span className="text-muted-foreground">
            {formatTimestamp(entry.changed_at)}
          </span>
        </div>

        {/* Reason (truncated) */}
        {hasReason && !isExpanded && (
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
            {truncateText(entry.reason!, 200)}
            {entry.reason!.length > 200 && expandable && (
              <button
                onClick={() => setIsExpanded(true)}
                className="ml-1 text-blue-600 hover:underline focus:outline-none"
              >
                Read more
              </button>
            )}
          </p>
        )}

        {/* Expanded Details */}
        {expandable && isExpanded && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Timestamp
              </span>
              <p className="text-sm">{formatTimestamp(entry.changed_at, true)}</p>
            </div>

            <div className="mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Changed By
              </span>
              <div className="flex items-center gap-2 mt-1">
                <UserAvatar
                  user={entry.changed_by_user}
                  name={entry.changed_by_name}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium">{entry.changed_by_name}</p>
                  {entry.changed_by_user?.email && (
                    <p className="text-xs text-muted-foreground">
                      {entry.changed_by_user.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {hasReason && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Reason
                </span>
                <p className="text-sm mt-1 whitespace-pre-wrap">{entry.reason}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expand/Collapse Button */}
      {expandable && (hasReason || entry.changed_by_user) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0"
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          aria-expanded={isExpanded}
          data-testid={`timeline-entry-expand-${entry.id}`}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )
})

// ============================================================================
// Main Component
// ============================================================================

export const StatusHistoryTimeline = memo(function StatusHistoryTimeline({
  entries,
  loading = false,
  error = null,
  expandable = true,
  maxEntries,
  onRetry,
  className,
  testId = 'status-history-timeline',
}: StatusHistoryTimelineProps) {
  const [showAll, setShowAll] = useState(false)

  // Sort entries by date (newest first)
  const sortedEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    )
  }, [entries])

  // Apply maxEntries limit
  const displayedEntries = useMemo(() => {
    if (!maxEntries || showAll) return sortedEntries
    return sortedEntries.slice(0, maxEntries)
  }, [sortedEntries, maxEntries, showAll])

  const hasMore = maxEntries && sortedEntries.length > maxEntries && !showAll
  const remainingCount = sortedEntries.length - (maxEntries || 0)

  // Loading state
  if (loading) {
    return (
      <div className={className} data-testid={testId}>
        <TimelineSkeleton />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={className} data-testid={testId}>
        <TimelineError error={error} onRetry={onRetry} />
      </div>
    )
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <div className={className} data-testid={testId}>
        <TimelineEmpty />
      </div>
    )
  }

  return (
    <div
      className={cn('relative', className)}
      data-testid={testId}
      role="list"
      aria-label="Status history timeline"
    >
      {/* Timeline Line */}
      <div
        className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200"
        aria-hidden="true"
      />

      {/* Entries */}
      <ol className="relative">
        {displayedEntries.map((entry, index) => (
          <li key={entry.id}>
            <TimelineEntryItem
              entry={entry}
              isFirst={index === 0}
              isLast={index === displayedEntries.length - 1 && !hasMore}
              expandable={expandable}
            />
          </li>
        ))}
      </ol>

      {/* View More Button */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(true)}
            className="w-full max-w-xs"
            data-testid="timeline-view-more"
          >
            View all {sortedEntries.length} entries ({remainingCount} more)
          </Button>
        </div>
      )}

      {/* View Less Button */}
      {showAll && maxEntries && sortedEntries.length > maxEntries && (
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(false)}
            data-testid="timeline-view-less"
          >
            Show less
          </Button>
        </div>
      )}
    </div>
  )
})

export default StatusHistoryTimeline
