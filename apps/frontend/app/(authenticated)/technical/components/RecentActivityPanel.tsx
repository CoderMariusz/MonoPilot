'use client'

/**
 * RecentActivityPanel Component (Story 02.12)
 * AC-12.17 to AC-12.19: Activity feed list (last 10 events)
 *
 * Features:
 * - Icon + Description + User + Timestamp
 * - Relative time display (2 hours ago)
 * - Click row to navigate to detail page
 * - View All Activity link
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Package,
  ClipboardList,
  Settings,
  AlertTriangle,
  RefreshCw,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { TechnicalRecentActivityResponse, ActivityType, EntityType } from '@/lib/types/dashboard'

interface RecentActivityPanelProps {
  data?: TechnicalRecentActivityResponse
  onActivityClick?: (entityType: EntityType, entityId: string) => void
  loading?: boolean
  error?: string
  onRetry?: () => void
}

// Icon mapping
const iconMap: Record<ActivityType, typeof Package> = {
  product_created: Package,
  product_updated: Package,
  bom_created: ClipboardList,
  bom_activated: ClipboardList,
  routing_created: Settings,
  routing_updated: Settings
}

// Skeleton for loading state
function RecentActivitySkeleton() {
  return (
    <Card className="h-full" data-testid="recent-activity-panel">
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-2">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Empty state
function RecentActivityEmpty() {
  return (
    <div className="text-center py-12">
      <Activity className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No recent activity</h3>
      <p className="mt-1 text-sm text-gray-500">
        No recent activity. Start creating products and BOMs.
      </p>
    </div>
  )
}

// Error state
function RecentActivityError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">Failed to load recent activity</h3>
      <p className="mt-1 text-sm text-gray-500">{error}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  )
}

export function RecentActivityPanel({
  data,
  onActivityClick,
  loading,
  error,
  onRetry
}: RecentActivityPanelProps) {
  const router = useRouter()

  if (loading) {
    return <RecentActivitySkeleton />
  }

  if (error) {
    return (
      <Card className="h-full" data-testid="recent-activity-panel">
        <CardContent className="p-6">
          <RecentActivityError error={error} onRetry={onRetry} />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.activities.length === 0) {
    return (
      <Card className="h-full" data-testid="recent-activity-panel">
        <CardContent className="p-6">
          <RecentActivityEmpty />
        </CardContent>
      </Card>
    )
  }

  const handleActivityClick = (entityType: EntityType, entityId: string, link: string) => {
    if (onActivityClick) {
      onActivityClick(entityType, entityId)
    } else {
      router.push(link)
    }
  }

  return (
    <Card className="h-full" data-testid="recent-activity-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {data.activities.map((activity) => {
            const Icon = iconMap[activity.type] || Package

            return (
              <button
                key={activity.id}
                className={cn(
                  'w-full flex items-start gap-3 p-2 rounded-lg',
                  'hover:bg-gray-50 cursor-pointer text-left',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'
                )}
                onClick={() => handleActivityClick(activity.entity_type, activity.entity_id, activity.link)}
                data-testid="activity-item"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 p-2 rounded-lg',
                    activity.entity_type === 'product' ? 'bg-blue-50' :
                    activity.entity_type === 'bom' ? 'bg-green-50' :
                    'bg-purple-50'
                  )}
                  role="img"
                  aria-label={activity.entity_type}
                >
                  <Icon className={cn(
                    'h-4 w-4',
                    activity.entity_type === 'product' ? 'text-blue-600' :
                    activity.entity_type === 'bom' ? 'text-green-600' :
                    'text-purple-600'
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm text-gray-900 truncate"
                    data-testid="activity-description"
                  >
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs text-gray-500"
                      data-testid="activity-user"
                    >
                      by {activity.user_name}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span
                      className="text-xs text-gray-500"
                      data-testid="activity-time"
                    >
                      {activity.relative_time}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* View All Link */}
        <div className="mt-4 pt-4 border-t">
          <Link
            href="/technical/audit-log"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            View All Activity
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default RecentActivityPanel
