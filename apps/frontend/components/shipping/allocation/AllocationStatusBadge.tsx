/**
 * Allocation Status Badge Component
 * Story 07.7: Inventory Allocation
 *
 * Displays allocation status with appropriate color and icon:
 * - Full (green): 100% allocation
 * - Partial (yellow): 1-99% allocation
 * - None (gray): 0% allocation
 *
 * Features:
 * - Size variants (sm, md, lg)
 * - Compact mode (icon + percentage only)
 * - Tooltip with allocation details
 * - Accessibility compliant
 */

'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

export type AllocationStatus = 'full' | 'partial' | 'none'

export interface AllocationStatusBadgeProps {
  status: AllocationStatus
  percentage: number
  allocatedQty?: number
  requiredQty?: number
  size?: 'sm' | 'md' | 'lg'
  compact?: boolean
  animate?: boolean
  className?: string
}

// =============================================================================
// Configuration
// =============================================================================

const STATUS_CONFIG: Record<
  AllocationStatus,
  {
    label: string
    color: string
    icon: React.ElementType
    iconTestId: string
  }
> = {
  full: {
    label: 'Fully Allocated',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconTestId: 'check-icon',
  },
  partial: {
    label: 'Partial',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertCircle,
    iconTestId: 'warning-icon',
  },
  none: {
    label: 'Not Allocated',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: XCircle,
    iconTestId: 'cross-icon',
  },
}

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
  lg: 'text-base px-2.5 py-1',
}

const ICON_SIZES = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format percentage with 1 decimal place
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Get aria label for screen readers
 */
function getAriaLabel(status: AllocationStatus, percentage: number): string {
  const statusLabel = STATUS_CONFIG[status].label
  return `Allocation Status: ${statusLabel} (${formatPercentage(percentage)})`
}

// =============================================================================
// Component
// =============================================================================

export function AllocationStatusBadge({
  status,
  percentage,
  allocatedQty,
  requiredQty,
  size = 'md',
  compact = false,
  animate = true,
  className,
}: AllocationStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  // Determine if animation should be shown (only for partial by default)
  const showAnimation = animate && status === 'partial'

  const badge = (
    <Badge
      variant="outline"
      role="status"
      className={cn(
        'inline-flex items-center gap-1 font-medium border',
        config.color,
        SIZE_CLASSES[size],
        showAnimation && 'animate-pulse',
        className
      )}
      data-testid="allocation-status-badge"
      aria-label={getAriaLabel(status, percentage)}
    >
      <Icon
        className={cn(ICON_SIZES[size])}
        aria-hidden="true"
        data-testid={config.iconTestId}
      />
      {!compact && <span>{config.label}</span>}
      <span className="tabular-nums">{formatPercentage(percentage)}</span>
    </Badge>
  )

  // If we have quantity details, wrap in tooltip
  if (allocatedQty !== undefined && requiredQty !== undefined) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">{config.label}</p>
              <p className="text-gray-500">
                {allocatedQty} / {requiredQty} units allocated
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}

export default AllocationStatusBadge
