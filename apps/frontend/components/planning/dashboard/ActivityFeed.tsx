/**
 * Activity Feed Component
 * Story: 03.16 - Planning Dashboard
 *
 * Displays recent activity feed with:
 * - Last 20 activities
 * - Entity icons (PO, TO, WO)
 * - Action types and user names
 * - Relative timestamps
 * - Clickable navigation to entity detail
 * - Empty, loading, and error states
 * - Keyboard navigation and ARIA support
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ShoppingCart,
  Truck,
  Factory,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  CircleCheck,
  Activity as ActivityIcon,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import type { Activity, ActivityAction, ActivityEntityType } from '@/lib/types/planning-dashboard'

export interface ActivityFeedProps {
  /** List of activities */
  activities: Activity[]
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Click handler for activity items */
  onActivityClick?: (activity: Activity) => void
  /** Retry handler for error state */
  onRetry?: () => void
  /** Additional class names */
  className?: string
}

// Entity type configuration
const ENTITY_TYPE_CONFIG: Record<
  ActivityEntityType,
  {
    icon: React.ElementType
    label: string
    color: string
    bgColor: string
  }
> = {
  purchase_order: {
    icon: ShoppingCart,
    label: 'PO',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  transfer_order: {
    icon: Truck,
    label: 'TO',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  work_order: {
    icon: Factory,
    label: 'WO',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
}

// Action type configuration
const ACTION_CONFIG: Record<
  ActivityAction,
  {
    icon: React.ElementType
    label: string
    color: string
  }
> = {
  created: {
    icon: Plus,
    label: 'created',
    color: 'text-green-600',
  },
  updated: {
    icon: Edit,
    label: 'updated',
    color: 'text-blue-600',
  },
  approved: {
    icon: CheckCircle,
    label: 'approved',
    color: 'text-green-600',
  },
  cancelled: {
    icon: XCircle,
    label: 'cancelled',
    color: 'text-red-600',
  },
  completed: {
    icon: CircleCheck,
    label: 'completed',
    color: 'text-purple-600',
  },
}

// Get entity route
const getEntityRoute = (entityType: ActivityEntityType, entityId: string): string => {
  switch (entityType) {
    case 'purchase_order':
      return `/planning/purchase-orders/${entityId}`
    case 'transfer_order':
      return `/planning/transfer-orders/${entityId}`
    case 'work_order':
      return `/planning/work-orders/${entityId}`
    default:
      return '#'
  }
}

// Format relative timestamp
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return 'just now'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  }
  if (diffDays === 1) {
    return 'Yesterday'
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`
  }
  // Format as date for older items
  return date.toLocaleDateString()
}

interface ActivityItemProps {
  activity: Activity
  onClick?: (activity: Activity) => void
}

/**
 * ActivityItem - Single activity list item
 */
function ActivityItem({ activity, onClick }: ActivityItemProps) {
  const router = useRouter()
  const entityConfig = ENTITY_TYPE_CONFIG[activity.entity_type]
  const actionConfig = ACTION_CONFIG[activity.action]
  const EntityIcon = entityConfig.icon

  const handleClick = () => {
    if (onClick) {
      onClick(activity)
    } else {
      router.push(getEntityRoute(activity.entity_type, activity.entity_id))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const relativeTime = formatRelativeTime(activity.timestamp)

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${activity.entity_number} was ${actionConfig.label} by ${activity.user_name}, ${relativeTime}`}
      data-testid={`activity-item-${activity.id}`}
    >
      <div className={cn('p-2 rounded-lg', entityConfig.bgColor)}>
        <EntityIcon className={cn('h-4 w-4', entityConfig.color)} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-gray-900">
            {activity.entity_number}
          </span>
          <span className="text-sm text-gray-500">was</span>
          <span className={cn('text-sm font-medium', actionConfig.color)}>
            {actionConfig.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          by {activity.user_name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5" title={new Date(activity.timestamp).toLocaleString()}>
          {relativeTime}
        </p>
      </div>
    </div>
  )
}

/**
 * ActivityFeedSkeleton - Loading state for activity feed
 */
function ActivityFeedSkeleton() {
  return (
    <div className="space-y-2" data-testid="activity-feed-loading">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * ActivityFeedEmpty - Empty state for activity feed
 */
function ActivityFeedEmpty() {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      data-testid="activity-feed-empty"
    >
      <ActivityIcon className="h-12 w-12 text-gray-300 mb-3" aria-hidden="true" />
      <p className="text-base font-medium text-gray-900">No recent activity</p>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">
        Create your first PO, TO, or WO to see activity here
      </p>
    </div>
  )
}

/**
 * ActivityFeedError - Error state for activity feed
 */
function ActivityFeedError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      data-testid="activity-feed-error"
    >
      <AlertTriangle className="h-12 w-12 text-red-500 mb-3" aria-hidden="true" />
      <p className="text-base font-medium text-red-600">Failed to load activity</p>
      <p className="text-sm text-gray-500 mt-1">{error}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4"
          aria-label="Retry loading activity"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  )
}

/**
 * ActivityFeed component for displaying recent activity
 */
export function ActivityFeed({
  activities,
  loading = false,
  error,
  onActivityClick,
  onRetry,
  className,
}: ActivityFeedProps) {
  // Sort activities by timestamp (newest first)
  const sortedActivities = React.useMemo(() => {
    return [...activities].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [activities])

  // Limit to 20 activities
  const displayActivities = sortedActivities.slice(0, 20)

  return (
    <Card className={cn('w-full', className)} data-testid="activity-feed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="h-5 w-5" aria-hidden="true" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {loading && <ActivityFeedSkeleton />}
        {!loading && error && <ActivityFeedError error={error} onRetry={onRetry} />}
        {!loading && !error && activities.length === 0 && <ActivityFeedEmpty />}
        {!loading && !error && activities.length > 0 && (
          <div
            className="space-y-1 max-h-[480px] overflow-y-auto"
            role="list"
            aria-label="Recent activity list"
          >
            {displayActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ActivityItem activity={activity} onClick={onActivityClick} />
                {index < displayActivities.length - 1 && (
                  <div className="border-b border-gray-100 mx-3" role="separator" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ActivityFeed
