/**
 * Activity Item Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Individual activity item in the timeline
 */

'use client'

import {
  ShoppingCart,
  CheckCircle,
  Package,
  ClipboardCheck,
  PackageCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityItem as ActivityItemType } from '@/lib/types/shipping-dashboard'

export interface ActivityItemProps {
  activity: ActivityItemType
  onClick?: () => void
}

const activityIcons = {
  so_created: ShoppingCart,
  so_confirmed: CheckCircle,
  so_shipped: Package,
  pick_completed: ClipboardCheck,
  shipment_packed: PackageCheck,
}

const activityColors = {
  so_created: 'bg-blue-100 text-blue-600',
  so_confirmed: 'bg-green-100 text-green-600',
  so_shipped: 'bg-purple-100 text-purple-600',
  pick_completed: 'bg-amber-100 text-amber-600',
  shipment_packed: 'bg-teal-100 text-teal-600',
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()

  if (diffMs < 0) return 'just now'

  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function ActivityItem({ activity, onClick }: ActivityItemProps) {
  const Icon = activityIcons[activity.type] || ShoppingCart
  const colorClass = activityColors[activity.type] || 'bg-gray-100 text-gray-600'

  return (
    <div
      data-testid={`activity-item-${activity.id}`}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Icon */}
      <div className={cn('p-2 rounded-full flex-shrink-0', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-medium text-blue-600 hover:underline"
            onClick={(e) => {
              if (onClick) {
                e.stopPropagation()
                onClick()
              }
            }}
          >
            {activity.entity_number}
          </span>
          <span className="text-gray-600 text-sm">{activity.description}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
          <span>{activity.created_by.name}</span>
          <span>-</span>
          <span data-testid="activity-timestamp">
            {formatRelativeTime(activity.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ActivityItem
