/**
 * WO Status Timeline Component
 * Story 03.10: Work Order CRUD
 * Status history timeline per PLAN-015
 */

'use client'

import {
  Clock,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  FileText,
  ArrowRight,
  User,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { WOStatusHistory, WOStatus } from '@/lib/types/work-order'
import { WO_STATUS_CONFIG } from '@/lib/types/work-order'

interface WOStatusTimelineProps {
  history: WOStatusHistory[]
  isLoading?: boolean
  className?: string
}

const STATUS_ICONS: Record<WOStatus, typeof CheckCircle> = {
  draft: FileText,
  planned: Clock,
  released: PlayCircle,
  in_progress: PlayCircle,
  on_hold: PauseCircle,
  completed: CheckCircle,
  closed: CheckCircle,
  cancelled: XCircle,
}

export function WOStatusTimeline({
  history,
  isLoading = false,
  className,
}: WOStatusTimelineProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No Status History</p>
        <p className="text-sm">Status changes will appear here</p>
      </div>
    )
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
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

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Timeline items */}
      <div className="space-y-6">
        {history.map((item, index) => {
          const Icon = item.to_status
            ? STATUS_ICONS[item.to_status] || FileText
            : FileText
          const statusConfig = item.to_status
            ? WO_STATUS_CONFIG[item.to_status]
            : null
          const fromConfig = item.from_status
            ? WO_STATUS_CONFIG[item.from_status]
            : null
          const { date, time } = formatDateTime(item.changed_at)

          return (
            <div key={item.id} className="relative flex gap-4 pl-2">
              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white',
                  statusConfig?.bgColor || 'bg-gray-100',
                  statusConfig?.textColor || 'text-gray-600'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status transition */}
                  {item.from_status && fromConfig && (
                    <>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          fromConfig.bgColor,
                          fromConfig.textColor
                        )}
                      >
                        {fromConfig.label}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                    </>
                  )}
                  {statusConfig && (
                    <Badge
                      className={cn(
                        'text-xs border-0',
                        statusConfig.bgColor,
                        statusConfig.textColor
                      )}
                    >
                      {statusConfig.label}
                    </Badge>
                  )}
                </div>

                {/* Date and user */}
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <span>{date}</span>
                  <span className="text-gray-300">|</span>
                  <span>{time}</span>
                  {item.changed_by_user?.name && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.changed_by_user.name}
                      </span>
                    </>
                  )}
                </div>

                {/* Notes */}
                {item.notes && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-md p-2 border">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WOStatusTimeline
