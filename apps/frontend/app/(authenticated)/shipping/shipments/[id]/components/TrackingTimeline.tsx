/**
 * TrackingTimeline Component
 * Story 07.14: Shipment Manifest & Ship + Tracking
 *
 * Vertical timeline showing shipment status progression
 * - Displays timestamps with user names
 * - Visual indicators for completed/active/pending steps
 * - Icons and colors for each status
 * - Accessible with ARIA labels
 */

'use client'

import { cn } from '@/lib/utils'
import { Box, FileText, Truck, CheckCircle, MapPin, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'

// =============================================================================
// Types
// =============================================================================

export interface Timeline {
  packed_at: string | null
  packed_by: string | null
  manifested_at: string | null
  manifested_by: string | null
  shipped_at: string | null
  shipped_by: string | null
  delivered_at: string | null
  delivered_by: string | null
}

export type ShipmentStatusType =
  | 'pending'
  | 'packing'
  | 'packed'
  | 'manifested'
  | 'shipped'
  | 'delivered'
  | 'exception'

export interface TrackingTimelineProps {
  timeline: Timeline
  currentStatus: ShipmentStatusType
}

// =============================================================================
// Helper Functions
// =============================================================================

const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return ''
  try {
    const date = parseISO(dateStr)
    return format(date, 'MMM d, yyyy HH:mm')
  } catch {
    return dateStr
  }
}

type StepStatus = 'completed' | 'active' | 'pending'

const getStepStatus = (
  stepKey: 'packed' | 'manifested' | 'shipped' | 'delivered',
  currentStatus: ShipmentStatusType,
  timestamp: string | null
): StepStatus => {
  // Status order for comparison
  const statusOrder: ShipmentStatusType[] = [
    'pending',
    'packing',
    'packed',
    'manifested',
    'shipped',
    'delivered',
  ]

  const stepStatusMap: Record<string, ShipmentStatusType> = {
    packed: 'packed',
    manifested: 'manifested',
    shipped: 'shipped',
    delivered: 'delivered',
  }

  const currentIndex = statusOrder.indexOf(currentStatus)
  const stepIndex = statusOrder.indexOf(stepStatusMap[stepKey])

  if (timestamp && currentIndex > stepIndex) {
    return 'completed'
  }
  if (timestamp && currentIndex === stepIndex) {
    return 'active'
  }
  if (!timestamp && currentIndex === stepIndex) {
    return 'active'
  }
  return 'pending'
}

// =============================================================================
// Step Component
// =============================================================================

interface TimelineStepProps {
  icon: React.ReactNode
  label: string
  timestamp: string | null
  user: string | null
  status: StepStatus
  colorClass: string
  isLast?: boolean
  testId?: string
}

function TimelineStep({
  icon,
  label,
  timestamp,
  user,
  status,
  colorClass,
  isLast = false,
  testId,
}: TimelineStepProps) {
  const isCompleted = status === 'completed'
  const isActive = status === 'active'
  const isPending = status === 'pending'

  return (
    <div
      className={cn('relative flex gap-4', !isLast && 'pb-8')}
      data-testid={testId}
      aria-label={`Status: ${label}, Date: ${timestamp || 'Not yet'}, User: ${user || 'N/A'}`}
    >
      {/* Connector Line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-5 top-10 -bottom-0 w-0.5',
            isCompleted ? colorClass.replace('text-', 'bg-') : 'bg-gray-200'
          )}
          data-testid="connector-1"
          aria-hidden="true"
        />
      )}

      {/* Icon Circle */}
      <div
        className={cn(
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
          isCompleted && `${colorClass} border-current bg-current/10`,
          isActive && `${colorClass} border-current bg-current text-white`,
          isPending && 'text-gray-400 border-gray-200 bg-gray-50'
        )}
      >
        {isCompleted && <CheckCircle className="h-5 w-5" />}
        {isActive && icon}
        {isPending && <Clock className="h-5 w-5" />}
      </div>

      {/* Content */}
      <div className="flex-1 pt-1">
        <h4
          className={cn(
            'text-sm font-medium',
            isCompleted && 'text-gray-900',
            isActive && 'text-gray-900 font-semibold',
            isPending && 'text-gray-400'
          )}
        >
          {label}
        </h4>
        {timestamp ? (
          <div className="mt-1 space-y-0.5">
            <p
              className={cn(
                'text-sm',
                isCompleted || isActive ? 'text-gray-600' : 'text-gray-400'
              )}
            >
              {formatDateTime(timestamp)}
            </p>
            {user && (
              <p
                className={cn(
                  'text-xs',
                  isCompleted || isActive ? 'text-gray-500' : 'text-gray-400'
                )}
              >
                by {user}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-400">
            {isPending ? 'Pending' : 'In progress...'}
          </p>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

export function TrackingTimeline({ timeline, currentStatus }: TrackingTimelineProps) {
  const steps = [
    {
      key: 'packed' as const,
      label: 'Packed',
      icon: <Box className="h-5 w-5" data-testid="icon-box" />,
      colorClass: 'text-blue-600',
      timestamp: timeline.packed_at,
      user: timeline.packed_by,
    },
    {
      key: 'manifested' as const,
      label: 'Manifested',
      icon: <FileText className="h-5 w-5" data-testid="icon-file" />,
      colorClass: 'text-purple-600',
      timestamp: timeline.manifested_at,
      user: timeline.manifested_by,
    },
    {
      key: 'shipped' as const,
      label: 'Shipped',
      icon: <Truck className="h-5 w-5" data-testid="icon-truck" />,
      colorClass: 'text-green-600',
      timestamp: timeline.shipped_at,
      user: timeline.shipped_by,
    },
    {
      key: 'delivered' as const,
      label: 'Delivered',
      icon: <CheckCircle className="h-5 w-5" data-testid="icon-check" />,
      colorClass: 'text-emerald-700',
      timestamp: timeline.delivered_at,
      user: timeline.delivered_by,
    },
  ]

  // Check if shipped but not delivered - show "In Transit" indicator
  const showInTransit =
    timeline.shipped_at && !timeline.delivered_at && currentStatus === 'shipped'

  return (
    <div
      role="region"
      aria-label="Shipment status timeline"
      data-testid="tracking-timeline"
      className="relative"
    >
      <div role="list">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.key, currentStatus, step.timestamp)

          // Insert "In Transit" after shipped step if applicable
          const isShippedStep = step.key === 'shipped'
          const isDeliveredStep = step.key === 'delivered'

          return (
            <div key={step.key} role="listitem">
              <TimelineStep
                icon={step.icon}
                label={step.label}
                timestamp={step.timestamp}
                user={step.user}
                status={stepStatus}
                colorClass={step.colorClass}
                isLast={isDeliveredStep && !showInTransit}
                testId={`timeline-step-${step.key}`}
              />

              {/* In Transit indicator */}
              {isShippedStep && showInTransit && (
                <div
                  className="relative flex gap-4 pb-8"
                  role="listitem"
                  aria-label="Status: In Transit"
                >
                  <div
                    className="absolute left-5 top-0 -bottom-0 w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 text-amber-600">
                    <MapPin className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className="text-sm font-medium text-amber-700">In Transit</h4>
                    <p className="mt-1 text-sm text-gray-500">With carrier</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TrackingTimeline
