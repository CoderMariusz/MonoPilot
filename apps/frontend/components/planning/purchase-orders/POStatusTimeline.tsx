/**
 * PO Status Timeline Component
 * Story 03.3: PO CRUD + Lines
 * Status history timeline per PLAN-006
 */

'use client'

import {
  FileText,
  Package,
  Send,
  CheckCircle,
  XCircle,
  Truck,
  FileUp,
  FileX,
  Clock,
  Edit,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { POStatusHistory } from '@/lib/types/purchase-order'

interface POStatusTimelineProps {
  history: POStatusHistory[]
  isLoading?: boolean
  className?: string
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

const getEventIcon = (eventType: POStatusHistory['event_type']) => {
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

const getEventColor = (eventType: POStatusHistory['event_type']): string => {
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

const getEventTitle = (event: POStatusHistory): string => {
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

const getEventDescription = (event: POStatusHistory): string | null => {
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

export function POStatusTimeline({
  history,
  isLoading = false,
  className,
}: POStatusTimelineProps) {
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
        {history.map((event, index) => {
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

export default POStatusTimeline
