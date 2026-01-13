/**
 * PO Status Timeline Component
 * Story 03.3: PO CRUD + Lines (original implementation)
 * Story 03.7: PO Status Lifecycle - Configurable Statuses (enhanced timeline)
 *
 * Displays status change history in a timeline visualization.
 * Supports both legacy event-based history and Story 03.7 status transition entries.
 */

'use client'

import { memo, useState, useMemo, useCallback } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  Settings,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { POStatusBadge, type ConfigurableStatus } from './POStatusBadge'

// ============================================================================
// TYPES - Story 03.7: Timeline Entry Interface
// ============================================================================

/**
 * User information for timeline entries
 */
export interface TimelineUser {
  id: string
  name: string
  email: string
  avatar_url?: string
}

/**
 * Status display information
 */
export interface StatusDisplay {
  name: string
  color: string
}

/**
 * Timeline entry for status transitions (Story 03.7)
 */
export interface TimelineEntry {
  id: string
  from_status: string | null
  to_status: string
  from_status_display?: StatusDisplay | null
  to_status_display?: StatusDisplay
  changed_by: TimelineUser | null
  changed_at: string
  notes: string | null
  transition_metadata?: Record<string, unknown>
}

/**
 * Props for the POStatusTimeline component
 */
export interface POStatusTimelineProps {
  /** Timeline entries */
  entries: TimelineEntry[]
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
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user initials for avatar fallback
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/**
 * Format timestamp for display
 */
function formatTimestamp(dateStr: string, full = false): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Full format for expanded view
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

  // Relative time for recent entries
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`

  // Date format for older entries
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Get color classes for timeline dot based on status color
 */
function getDotColorClasses(color: string | undefined): string {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    teal: 'bg-teal-500',
    indigo: 'bg-indigo-500',
  }
  return colorMap[color?.toLowerCase() || 'gray'] || 'bg-gray-500'
}

/**
 * Convert timeline entry to configurable status format for badge
 */
function toConfigurableStatus(
  code: string,
  display?: StatusDisplay | null
): ConfigurableStatus {
  return {
    code,
    name: display?.name || code,
    color: display?.color || 'gray',
  }
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Loading skeleton for timeline
 */
function TimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-6" aria-label="Loading history" role="status">
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

/**
 * Empty state for timeline
 */
function TimelineEmpty() {
  return (
    <div
      className="text-center py-12 text-muted-foreground"
      role="status"
      aria-label="No status history available"
    >
      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium">No status history available</p>
      <p className="text-sm">Status changes will appear here</p>
    </div>
  )
}

/**
 * Error state for timeline
 */
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
    >
      <div className="text-red-500 mb-4">
        <Settings className="h-12 w-12 mx-auto opacity-50" />
      </div>
      <p className="text-lg font-medium text-red-600">{error}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  )
}

/**
 * User avatar with tooltip
 */
function UserAvatar({
  user,
  size = 'md',
}: {
  user: TimelineUser | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  }

  if (!user) {
    return (
      <Avatar className={sizeClasses[size]}>
        <AvatarFallback className="bg-gray-200 text-gray-600">
          <Settings className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    )
  }

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
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Single timeline entry component
 */
const TimelineEntryItem = memo(function TimelineEntryItem({
  entry,
  isFirst,
  isLast,
  expandable,
  index,
}: {
  entry: TimelineEntry
  isFirst: boolean
  isLast: boolean
  expandable: boolean
  index: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isCreation = entry.from_status === null
  const isSystemTransition = entry.changed_by === null
  const hasNotes = entry.notes && entry.notes.trim().length > 0
  const hasMetadata =
    entry.transition_metadata &&
    Object.keys(entry.transition_metadata).length > 0

  // Alternate left/right placement for visual interest (desktop)
  const isLeftAligned = index % 2 === 0

  // Get status display for badges
  const toStatus = toConfigurableStatus(
    entry.to_status,
    entry.to_status_display
  )
  const fromStatus = entry.from_status
    ? toConfigurableStatus(entry.from_status, entry.from_status_display)
    : null

  // Dot color based on destination status
  const dotColorClass = getDotColorClasses(entry.to_status_display?.color)

  const content = (
    <div
      className={cn(
        'relative flex gap-4 pb-6',
        !isLast && 'border-l-2 border-gray-200 ml-[19px] pl-6'
      )}
      role="listitem"
      aria-label={`Status changed to ${toStatus.name} on ${formatTimestamp(entry.changed_at)}`}
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
              <POStatusBadge status={toStatus} size="sm" />
            </>
          ) : (
            <>
              {fromStatus && <POStatusBadge status={fromStatus} size="sm" />}
              <ArrowRight
                className="h-4 w-4 text-muted-foreground flex-shrink-0"
                aria-hidden="true"
              />
              <POStatusBadge status={toStatus} size="sm" />
            </>
          )}
        </div>

        {/* User and Timestamp */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {isSystemTransition ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
              SYSTEM
            </span>
          ) : entry.changed_by ? (
            <span className="flex items-center gap-2">
              <UserAvatar user={entry.changed_by} size="sm" />
              <a
                href={`/settings/users/${entry.changed_by.id}`}
                className="font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                {entry.changed_by.name}
              </a>
            </span>
          ) : null}
          <span className="text-muted-foreground">
            {formatTimestamp(entry.changed_at)}
          </span>
        </div>

        {/* Notes (truncated) */}
        {hasNotes && !isExpanded && (
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
            {truncateText(entry.notes!, 200)}
            {entry.notes!.length > 200 && expandable && (
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
            {/* Full Timestamp */}
            <div className="mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Timestamp
              </span>
              <p className="text-sm">{formatTimestamp(entry.changed_at, true)}</p>
            </div>

            {/* User Details */}
            {entry.changed_by && (
              <div className="mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Changed By
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <UserAvatar user={entry.changed_by} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{entry.changed_by.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.changed_by.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {entry.changed_by.id}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Full Notes */}
            {hasNotes && (
              <div className="mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Notes
                </span>
                <p className="text-sm mt-1 whitespace-pre-wrap">{entry.notes}</p>
              </div>
            )}

            {/* Transition Metadata */}
            {hasMetadata && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Metadata
                </span>
                <pre className="text-xs mt-1 p-2 bg-white rounded border overflow-x-auto">
                  {JSON.stringify(entry.transition_metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expand/Collapse Button */}
      {expandable && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0"
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          aria-expanded={isExpanded}
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

  return content
})

// ============================================================================
// MAIN COMPONENT - Story 03.7
// ============================================================================

/**
 * PO Status Timeline Component
 *
 * Displays a timeline of status transitions for a purchase order.
 * Entries are shown in reverse chronological order (newest first).
 *
 * @example
 * // Basic usage
 * <POStatusTimeline entries={statusHistory} />
 *
 * @example
 * // With expandable entries and limit
 * <POStatusTimeline
 *   entries={statusHistory}
 *   expandable={true}
 *   maxEntries={5}
 * />
 *
 * @example
 * // Loading state
 * <POStatusTimeline entries={[]} loading={true} />
 *
 * @example
 * // Error state with retry
 * <POStatusTimeline
 *   entries={[]}
 *   error="Failed to load history"
 *   onRetry={() => refetch()}
 * />
 */
export const POStatusTimeline = memo(function POStatusTimeline({
  entries,
  loading = false,
  error = null,
  expandable = true,
  maxEntries,
  onRetry,
  className,
  testId,
}: POStatusTimelineProps) {
  const [showAll, setShowAll] = useState(false)

  // Sort entries by date (newest first - reverse chronological)
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
              index={index}
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
          >
            Show less
          </Button>
        </div>
      )}
    </div>
  )
})

// ============================================================================
// LEGACY COMPONENT - Backwards Compatibility (Story 03.3)
// ============================================================================

// Re-export the legacy types and component for backwards compatibility
export type { POStatusHistory } from '@/lib/types/purchase-order'

import type { POStatusHistory as LegacyPOStatusHistory } from '@/lib/types/purchase-order'
import {
  FileText,
  Package,
  Send,
  CheckCircle,
  XCircle,
  Truck,
  FileUp,
  FileX,
  Edit,
} from 'lucide-react'

interface LegacyPOStatusTimelineProps {
  history: LegacyPOStatusHistory[]
  isLoading?: boolean
  className?: string
}

const getEventIcon = (eventType: LegacyPOStatusHistory['event_type']) => {
  switch (eventType) {
    case 'po_created':
      return <FileText className="h-4 w-4" />
    case 'line_added':
    case 'line_updated':
    case 'line_deleted':
      return <Package className="h-4 w-4" />
    case 'po_submitted':
      return <Send className="h-4 w-4" />
    case 'po_approved':
      return <CheckCircle className="h-4 w-4" />
    case 'po_rejected':
      return <XCircle className="h-4 w-4" />
    case 'status_change':
      return <Clock className="h-4 w-4" />
    case 'grn_created':
      return <Truck className="h-4 w-4" />
    case 'document_uploaded':
      return <FileUp className="h-4 w-4" />
    case 'document_deleted':
      return <FileX className="h-4 w-4" />
    default:
      return <Edit className="h-4 w-4" />
  }
}

const getEventColor = (eventType: LegacyPOStatusHistory['event_type']): string => {
  switch (eventType) {
    case 'po_approved':
      return 'text-green-600 bg-green-50'
    case 'po_rejected':
      return 'text-red-600 bg-red-50'
    case 'grn_created':
      return 'text-purple-600 bg-purple-50'
    case 'po_submitted':
      return 'text-blue-600 bg-blue-50'
    case 'po_created':
      return 'text-gray-600 bg-gray-50'
    default:
      return 'text-gray-500 bg-gray-50'
  }
}

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} - ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const getEventTitle = (event: LegacyPOStatusHistory): string => {
  switch (event.event_type) {
    case 'po_created':
      return 'PO Created'
    case 'line_added':
      return `Line Added: ${event.details?.product || 'Product'}`
    case 'line_updated':
      return 'Line Updated'
    case 'line_deleted':
      return `Line Removed: ${event.details?.product || 'Product'}`
    case 'po_submitted':
      return 'PO Submitted'
    case 'po_approved':
      return 'Approved'
    case 'po_rejected':
      return 'Rejected'
    case 'status_change':
      return `Status Changed: ${event.details?.from_status || '?'} -> ${event.details?.to_status || '?'}`
    case 'grn_created':
      return `GRN Created - ${event.details?.grn_number || 'GRN'}`
    case 'document_uploaded':
      return `Document Uploaded: ${event.details?.file_name || 'File'}`
    case 'document_deleted':
      return `Document Deleted: ${event.details?.file_name || 'File'}`
    default:
      return 'Event'
  }
}

const getEventDescription = (event: LegacyPOStatusHistory): string | null => {
  switch (event.event_type) {
    case 'po_created':
      return event.details?.reason || null
    case 'line_added':
      return event.details?.quantity ? `Quantity: ${event.details.quantity}` : null
    case 'po_rejected':
      return event.details?.rejection_reason || null
    case 'po_approved':
      return event.details?.approval_notes || null
    case 'status_change':
      return event.details?.reason || null
    case 'grn_created':
      if (event.details?.lines_received && Array.isArray(event.details.lines_received)) {
        return `Received: ${event.details.lines_received.map((l) => `${l.product} (${l.quantity})`).join(', ')}`
      }
      return null
    default:
      return null
  }
}

/**
 * Legacy PO Status Timeline for backwards compatibility
 * Uses event-based history from Story 03.3
 *
 * @deprecated Use POStatusTimeline with entries prop instead
 */
export function LegacyPOStatusTimeline({
  history,
  isLoading = false,
  className,
}: LegacyPOStatusTimelineProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3, 4, 5].map((i) => (
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

  if (history.length === 0) {
    return (
      <div className={cn('text-center py-12 text-muted-foreground', className)}>
        No history events
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Timeline Line */}
      <div className="absolute left-5 top-2 bottom-2 w-px bg-gray-200" />

      {/* Events */}
      <div className="space-y-6">
        {history.map((event) => {
          const Icon = () => getEventIcon(event.event_type)
          const colorClass = getEventColor(event.event_type)
          const title = getEventTitle(event)
          const description = getEventDescription(event)

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-sm',
                  colorClass
                )}
              >
                <Icon />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.user_name}
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(event.event_date)}
                  </time>
                </div>
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
                {event.event_type === 'grn_created' && event.details?.grn_id && (
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-auto text-sm"
                    asChild
                  >
                    <a href={`/warehouse/receiving/${event.details.grn_id}`}>
                      View GRN
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default POStatusTimeline
