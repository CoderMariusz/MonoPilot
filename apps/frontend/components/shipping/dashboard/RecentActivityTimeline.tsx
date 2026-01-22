/**
 * Recent Activity Timeline Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Timeline showing recent shipping activity
 */

'use client'

import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityItem } from './ActivityItem'
import { History } from 'lucide-react'
import type { ActivityItem as ActivityItemType } from '@/lib/types/shipping-dashboard'

export interface RecentActivityTimelineProps {
  activities: ActivityItemType[]
  isLoading: boolean
  onLoadMore?: () => void
}

export function RecentActivityTimeline({
  activities,
  isLoading,
  onLoadMore,
}: RecentActivityTimelineProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <Card
        role="region"
        aria-label="Recent Activity"
        data-testid="recent-activity"
      >
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="activity-skeleton">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort activities by created_at DESC
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  if (sortedActivities.length === 0) {
    return (
      <Card
        role="region"
        aria-label="Recent Activity"
        data-testid="recent-activity"
      >
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <History className="h-10 w-10 mb-2 text-gray-300" />
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      role="region"
      aria-label="Recent Activity"
      data-testid="recent-activity"
    >
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {sortedActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onClick={() => {
                // Navigate based on entity type
                switch (activity.entity_type) {
                  case 'sales_order':
                    router.push(`/shipping/sales-orders/${activity.entity_id}`)
                    break
                  case 'pick_list':
                    router.push(`/shipping/pick-lists/${activity.entity_id}`)
                    break
                  case 'shipment':
                    router.push(`/shipping/shipments/${activity.entity_id}`)
                    break
                }
              }}
            />
          ))}
        </div>

        {onLoadMore && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={onLoadMore}>
              Load more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivityTimeline
