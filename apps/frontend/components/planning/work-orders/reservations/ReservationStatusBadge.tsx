/**
 * Reservation Status Badge Component
 * Story 03.11b: WO Material Reservations (LP Allocation)
 * Visual indicator showing reservation coverage status for a WO material
 * Pattern: ShadCN Badge with color variants (adapted from PLAN-026 wireframe)
 */

'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CheckCircle2, AlertTriangle, Circle, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CoverageStatus } from '@/lib/validation/wo-reservations'

// ============================================================================
// TYPES
// ============================================================================

export interface ReservationStatusBadgeProps {
  requiredQty: number
  reservedQty: number
  uom: string
  size?: 'default' | 'large'
  showTooltip?: boolean
  className?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get reservation status based on required and reserved quantities
 */
function getReservationStatus(required: number, reserved: number): CoverageStatus {
  if (reserved === 0) return 'none'
  if (reserved >= required) {
    return reserved > required ? 'over' : 'full'
  }
  return 'partial'
}

/**
 * Calculate coverage percentage
 */
function getCoveragePercent(required: number, reserved: number): number {
  if (required === 0) return 0
  return Math.round((reserved / required) * 100)
}

/**
 * Format number with commas and limited decimals
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

interface StatusConfig {
  label: string
  bgColor: string
  textColor: string
  Icon: typeof CheckCircle2
  getTooltip: (required: number, reserved: number, uom: string) => string
}

const STATUS_CONFIG: Record<CoverageStatus, StatusConfig> = {
  full: {
    label: 'Full',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    Icon: CheckCircle2,
    getTooltip: (required, reserved, uom) =>
      `Fully reserved: ${formatNumber(reserved)} ${uom} of ${formatNumber(required)} ${uom} required`,
  },
  partial: {
    label: 'Partial',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    Icon: AlertTriangle,
    getTooltip: (required, reserved, uom) =>
      `${formatNumber(required - reserved)} ${uom} short of required ${formatNumber(required)} ${uom}`,
  },
  none: {
    label: 'None',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    Icon: Circle,
    getTooltip: () => 'No LPs reserved yet',
  },
  over: {
    label: 'Over',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    Icon: PlusCircle,
    getTooltip: (required, reserved, uom) =>
      `${formatNumber(reserved - required)} ${uom} over required quantity`,
  },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReservationStatusBadge({
  requiredQty,
  reservedQty,
  uom,
  size = 'default',
  showTooltip = true,
  className,
}: ReservationStatusBadgeProps) {
  const status = getReservationStatus(requiredQty, reservedQty)
  const percent = getCoveragePercent(requiredQty, reservedQty)
  const config = STATUS_CONFIG[status]
  const Icon = config.Icon

  const sizeClasses = {
    default: 'text-xs px-2 py-0.5 h-6',
    large: 'text-sm px-3 py-1 h-8',
  }

  const iconSizeClasses = {
    default: 'h-3 w-3',
    large: 'h-4 w-4',
  }

  const badge = (
    <Badge
      variant="secondary"
      className={cn(
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        'font-medium border-0 gap-1',
        className
      )}
      role="status"
      aria-label={`Reservation status: ${config.label} ${percent}%`}
    >
      <Icon className={iconSizeClasses[size]} aria-hidden="true" />
      <span>{config.label}</span>
      <span>{percent}%</span>
    </Badge>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{config.getTooltip(requiredQty, reservedQty, uom)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ReservationStatusBadge
