/**
 * Availability Traffic Light Component - Story 03.13
 *
 * Visual indicator (colored circle) showing material availability status.
 * Green = Sufficient (>=100%), Yellow = Low Stock (50-99%),
 * Red = Shortage (<50%), Red outline = No Stock (0%)
 *
 * @module components/planning/work-orders/availability/AvailabilityTrafficLight
 */

'use client'

import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { AvailabilityStatus } from '@/lib/types/wo-availability'
import { getStatusLabel, AVAILABILITY_COLORS } from '@/lib/types/wo-availability'

export interface AvailabilityTrafficLightProps {
  status: AvailabilityStatus
  coveragePercent?: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const

const STATUS_STYLES = {
  sufficient: 'bg-green-500',
  low_stock: 'bg-yellow-500',
  shortage: 'bg-red-500',
  no_stock: 'bg-transparent border-2 border-red-500',
} as const

const TOOLTIPS: Record<AvailabilityStatus, string> = {
  sufficient: 'Sufficient - Stock available',
  low_stock: 'Low Stock - 50-99% available',
  shortage: 'Shortage - Less than 50% available',
  no_stock: 'No Stock - 0% available',
}

/**
 * Traffic light indicator for material availability status
 *
 * @param status - Availability status (sufficient, low_stock, shortage, no_stock)
 * @param coveragePercent - Optional coverage percentage for tooltip
 * @param size - Size variant (sm=16px, md=24px, lg=32px)
 * @param showTooltip - Show tooltip on hover (default: true)
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <AvailabilityTrafficLight status="sufficient" coveragePercent={120} />
 * <AvailabilityTrafficLight status="shortage" size="lg" />
 * ```
 */
export function AvailabilityTrafficLight({
  status,
  coveragePercent,
  size = 'sm',
  showTooltip = true,
  className,
}: AvailabilityTrafficLightProps) {
  const label = getStatusLabel(status)
  const tooltip = coveragePercent !== undefined
    ? `${label}, ${Math.round(coveragePercent)}% coverage`
    : TOOLTIPS[status]

  const indicator = (
    <div
      className={cn(
        'rounded-full flex-shrink-0',
        SIZE_CLASSES[size],
        STATUS_STYLES[status],
        className
      )}
      role="img"
      aria-label={`Status: ${tooltip}`}
      data-testid={`traffic-light-${status}`}
    />
  )

  if (!showTooltip) {
    return indicator
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center justify-center min-w-[48px] min-h-[48px]">
            {indicator}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default AvailabilityTrafficLight
