/**
 * ReservationStatusBadge Component (Story 04.8)
 * Visual indicator of reservation coverage status
 *
 * Wireframe: PLAN-026 Component 4
 *
 * Variants:
 * - Full (100%): Green - CheckCircle
 * - Partial (1-99%): Yellow - AlertTriangle
 * - None (0%): Gray - Circle
 * - Over (>100%): Blue - PlusCircle
 */

'use client'

import { CheckCircle, AlertTriangle, Circle, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { CoverageStatus } from '@/lib/validation/wo-reservations'

export interface ReservationStatusBadgeProps {
  requiredQty: number
  reservedQty: number
  uom: string
  size?: 'default' | 'large'
  showTooltip?: boolean
}

/**
 * Calculate coverage status from quantities
 */
export function getCoverageStatus(required: number, reserved: number): CoverageStatus {
  if (reserved === 0) return 'none'
  if (reserved > required) return 'over'
  if (reserved >= required) return 'full'
  return 'partial'
}

/**
 * Calculate coverage percentage
 */
export function getCoveragePercent(required: number, reserved: number): number {
  if (required === 0) return reserved > 0 ? 100 : 0
  return Math.round((reserved / required) * 100)
}

/**
 * Get shortage amount
 */
function getShortage(required: number, reserved: number): number {
  return Math.max(0, required - reserved)
}

/**
 * Get excess amount
 */
function getExcess(required: number, reserved: number): number {
  return Math.max(0, reserved - required)
}

/**
 * Get tooltip text based on status
 */
function getTooltipText(
  status: CoverageStatus,
  required: number,
  reserved: number,
  uom: string
): string {
  const shortage = getShortage(required, reserved)
  const excess = getExcess(required, reserved)

  switch (status) {
    case 'full':
      return `Fully reserved: ${reserved} ${uom}`
    case 'partial':
      return `${shortage} ${uom} short of required ${required} ${uom}`
    case 'none':
      return 'No LPs reserved yet'
    case 'over':
      return `${excess} ${uom} over required quantity`
    default:
      return ''
  }
}

export function ReservationStatusBadge({
  requiredQty,
  reservedQty,
  uom,
  size = 'default',
  showTooltip = true,
}: ReservationStatusBadgeProps) {
  const status = getCoverageStatus(requiredQty, reservedQty)
  const percent = getCoveragePercent(requiredQty, reservedQty)
  const tooltipText = getTooltipText(status, requiredQty, reservedQty, uom)

  // Status configuration
  const statusConfig = {
    full: {
      label: 'Full',
      color: 'bg-green-100 text-green-800',
      Icon: CheckCircle,
    },
    partial: {
      label: 'Partial',
      color: 'bg-yellow-100 text-yellow-800',
      Icon: AlertTriangle,
    },
    none: {
      label: 'None',
      color: 'bg-gray-100 text-gray-800',
      Icon: Circle,
    },
    over: {
      label: 'Over',
      color: 'bg-blue-100 text-blue-800',
      Icon: PlusCircle,
    },
  }

  const config = statusConfig[status]
  const Icon = config.Icon

  // Size classes
  const sizeClasses = {
    default: {
      badge: 'px-2 py-0.5 text-xs',
      icon: 'h-3 w-3',
    },
    large: {
      badge: 'px-3 py-1 text-sm',
      icon: 'h-4 w-4',
    },
  }

  const BadgeContent = (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium',
        config.color,
        sizeClasses[size].badge
      )}
      data-testid="reservation-status-badge"
      data-status={status}
      aria-label={`Reservation status: ${config.label} ${percent}%`}
    >
      <Icon
        className={sizeClasses[size].icon}
        aria-hidden="true"
        data-testid="status-icon"
      />
      <span>
        {config.label} {percent}%
      </span>
    </div>
  )

  if (!showTooltip) {
    return BadgeContent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{BadgeContent}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ReservationStatusBadge
