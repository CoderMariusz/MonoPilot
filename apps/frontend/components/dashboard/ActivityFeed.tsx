'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface ActivityLog {
  id: string
  activity_type: string
  entity_type: string
  entity_id: string
  entity_code: string
  description: string
  created_at: string
  user?: {
    first_name: string
    last_name: string
    email: string
  }
}

interface ActivityFeedProps {
  limit?: number
}

export function ActivityFeed({ limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(`/api/dashboard/activity?limit=${limit}`)
        if (!res.ok) throw new Error('Failed to fetch activities')
        const data = await res.json()
        setActivities(data.activities || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()

    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [limit])

  const getActivityIcon = (type: string) => {
    if (type.startsWith('wo_')) return '🏭'
    if (type.startsWith('po_')) return '📦'
    if (type.startsWith('lp_')) return '📋'
    if (type.startsWith('ncr_')) return '⚠️'
    if (type.startsWith('user_')) return '👤'
    return '📌'
  }

  const getEntityLink = (activity: ActivityLog): string => {
    const { entity_type, entity_id } = activity

    switch (entity_type) {
      case 'work_order':
        return `/production/work-orders/${entity_id}`
      case 'purchase_order':
        return `/planning/purchase-orders/${entity_id}`
      case 'transfer_order':
        return `/warehouse/transfers/${entity_id}`
      case 'license_plate':
        return `/warehouse/license-plates/${entity_id}`
      case 'ncr':
        return `/quality/ncr/${entity_id}`
      case 'shipment':
        return `/shipping/shipments/${entity_id}`
      case 'user':
        return `/settings/users/${entity_id}`
      case 'organization':
        return `/settings`
      case 'module':
        return `/settings/modules`
      default:
        return '#'
    }
  }

  if (loading) {
    return (
      <Card className="w-full lg:w-80">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full lg:w-80">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load activities</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full lg:w-80">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={getEntityLink(activity)}
                className="flex items-start gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors cursor-pointer block"
              >
                <div className="text-2xl flex-shrink-0">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.entity_code}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {activity.user?.first_name} {activity.user?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
