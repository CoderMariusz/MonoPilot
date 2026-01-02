/**
 * PO Status Badge Component
 * Story 03.3: PO CRUD + Lines (original implementation)
 * Story 03.5b: PO Approval Workflow (added approval state styling)
 * Story 03.7: PO Status Lifecycle - Configurable Statuses (dynamic color support)
 *
 * Displays purchase order status with color coding per PLAN-004
 * Supports both fixed POStatus type and configurable status objects
 */

'use client'

import { memo } from 'react'
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { POStatus } from '@/lib/types/purchase-order'
import { PO_STATUS_CONFIG } from '@/lib/types/purchase-order'

// ============================================================================
// TYPES - Story 03.7: Configurable Status Interface
// ============================================================================

/**
 * Color options for configurable statuses (11 standard colors)
 */
export type StatusColor =
  | 'gray'
  | 'blue'
  | 'yellow'
  | 'green'
  | 'purple'
  | 'emerald'
  | 'red'
  | 'orange'
  | 'amber'
  | 'teal'
  | 'indigo'

/**
 * Configurable status object interface (Story 03.7)
 */
export interface ConfigurableStatus {
  code: string
  name: string
  color: StatusColor | string
}

/**
 * Size variants for the badge
 */
export type BadgeSize = 'sm' | 'md' | 'lg'

/**
 * Visual variants for the badge
 */
export type BadgeVariant = 'default' | 'outline' | 'subtle'

// ============================================================================
// COLOR MAPPING - All 11 Colors
// ============================================================================

/**
 * Maps color names to Tailwind CSS classes for each variant
 */
const COLOR_CLASSES: Record<
  string,
  { default: string; outline: string; subtle: string; text: string; border: string }
> = {
  gray: {
    default: 'bg-gray-100',
    outline: 'bg-transparent',
    subtle: 'bg-gray-50',
    text: 'text-gray-800',
    border: 'border-gray-300',
  },
  blue: {
    default: 'bg-blue-100',
    outline: 'bg-transparent',
    subtle: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-300',
  },
  yellow: {
    default: 'bg-yellow-100',
    outline: 'bg-transparent',
    subtle: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
  },
  green: {
    default: 'bg-green-100',
    outline: 'bg-transparent',
    subtle: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-300',
  },
  purple: {
    default: 'bg-purple-100',
    outline: 'bg-transparent',
    subtle: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-300',
  },
  emerald: {
    default: 'bg-emerald-100',
    outline: 'bg-transparent',
    subtle: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
  },
  red: {
    default: 'bg-red-100',
    outline: 'bg-transparent',
    subtle: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-300',
  },
  orange: {
    default: 'bg-orange-100',
    outline: 'bg-transparent',
    subtle: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-300',
  },
  amber: {
    default: 'bg-amber-100',
    outline: 'bg-transparent',
    subtle: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  teal: {
    default: 'bg-teal-100',
    outline: 'bg-transparent',
    subtle: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-300',
  },
  indigo: {
    default: 'bg-indigo-100',
    outline: 'bg-transparent',
    subtle: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-300',
  },
}

// ============================================================================
// SIZE CLASSES
// ============================================================================

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-3 py-1.5',
}

const ICON_SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color classes for a given color name
 */
function getColorClasses(color: string | null | undefined) {
  const normalizedColor = (color || 'gray').toLowerCase()
  return COLOR_CLASSES[normalizedColor] || COLOR_CLASSES.gray
}

/**
 * Get icon for approval-related statuses
 */
function getStatusIcon(statusCode: string, size: BadgeSize) {
  const iconClass = cn(ICON_SIZE_CLASSES[size], 'mr-1 flex-shrink-0')

  switch (statusCode) {
    case 'pending_approval':
      return <Clock className={iconClass} aria-hidden="true" />
    case 'approved':
      return <CheckCircle2 className={iconClass} aria-hidden="true" />
    case 'rejected':
    case 'cancelled':
      return <XCircle className={iconClass} aria-hidden="true" />
    default:
      return null
  }
}

/**
 * Get tooltip text for status
 */
function getTooltipText(statusCode: string, statusName: string): string {
  switch (statusCode) {
    case 'draft':
      return 'PO is in draft mode and can be edited'
    case 'submitted':
      return 'PO has been submitted and is awaiting processing'
    case 'pending_approval':
      return 'PO is waiting for manager approval'
    case 'approved':
      return 'PO has been approved and is ready for confirmation'
    case 'rejected':
      return 'PO was rejected and can be edited and resubmitted'
    case 'confirmed':
      return 'PO has been confirmed with the supplier'
    case 'receiving':
      return 'PO is currently being received at the warehouse'
    case 'closed':
      return 'PO has been fully received and closed'
    case 'cancelled':
      return 'PO has been cancelled'
    default:
      return `Status: ${statusName}`
  }
}

// ============================================================================
// COMPONENT PROPS - Story 03.7 Interface
// ============================================================================

/**
 * Props for configurable status badge (Story 03.7)
 */
export interface POStatusBadgeProps {
  /** Status object with code, name, and color */
  status: ConfigurableStatus | undefined | null
  /** Size variant */
  size?: BadgeSize
  /** Visual variant */
  variant?: BadgeVariant
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string | null
  /** Show tooltip with status details */
  showTooltip?: boolean
  /** Additional CSS classes */
  className?: string
  /** Test ID for testing */
  testId?: string
}

/**
 * Legacy props interface for backwards compatibility (Story 03.3)
 */
export interface LegacyPOStatusBadgeProps {
  status: POStatus
  className?: string
  size?: 'sm' | 'default' | 'lg'
  showTooltip?: boolean
  approvalStatus?: 'pending' | 'approved' | 'rejected' | null
}

// ============================================================================
// LOADING STATE
// ============================================================================

function BadgeSkeleton({ size = 'md' }: { size?: BadgeSize }) {
  const skeletonSizes = {
    sm: 'h-5 w-16',
    md: 'h-6 w-20',
    lg: 'h-7 w-24',
  }

  return (
    <Skeleton
      className={cn('rounded-md', skeletonSizes[size])}
      aria-label="Loading status"
    />
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

function BadgeError({ error, size = 'md' }: { error: string; size?: BadgeSize }) {
  return (
    <Badge
      variant="destructive"
      className={cn(
        SIZE_CLASSES[size],
        'rounded-md border inline-flex items-center'
      )}
      role="alert"
      aria-label={`Error: ${error}`}
    >
      <AlertCircle className={cn(ICON_SIZE_CLASSES[size], 'mr-1')} aria-hidden="true" />
      Error
    </Badge>
  )
}

// ============================================================================
// MAIN COMPONENT - Story 03.7
// ============================================================================

/**
 * PO Status Badge Component
 *
 * Displays a status badge with dynamic color based on configuration.
 * Supports all 11 standard colors, multiple sizes, and visual variants.
 *
 * @example
 * // Basic usage with configurable status
 * <POStatusBadge
 *   status={{ code: 'draft', name: 'Draft', color: 'gray' }}
 * />
 *
 * @example
 * // With size and variant
 * <POStatusBadge
 *   status={{ code: 'confirmed', name: 'Confirmed', color: 'green' }}
 *   size="lg"
 *   variant="outline"
 * />
 *
 * @example
 * // Loading state
 * <POStatusBadge status={null} loading={true} />
 *
 * @example
 * // Error state
 * <POStatusBadge status={null} error="Failed to load status" />
 */
export const POStatusBadge = memo(function POStatusBadge({
  status,
  size = 'md',
  variant = 'default',
  loading = false,
  error = null,
  showTooltip = false,
  className,
  testId,
}: POStatusBadgeProps) {
  // Loading state
  if (loading) {
    return <BadgeSkeleton size={size} />
  }

  // Error state
  if (error) {
    return <BadgeError error={error} size={size} />
  }

  // Handle undefined/null status
  if (!status) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          SIZE_CLASSES[size],
          'rounded-md border bg-gray-100 text-gray-500 border-gray-200',
          className
        )}
        role="status"
        aria-label="Unknown status"
        data-testid={testId}
      >
        Unknown
      </Badge>
    )
  }

  // Get color classes for the status
  const colorClasses = getColorClasses(status.color)
  const icon = getStatusIcon(status.code, size)
  const isPending = status.code === 'pending_approval'
  const isCancelled = status.code === 'cancelled'

  // Build variant-specific classes
  const variantClasses = {
    default: cn(colorClasses.default, colorClasses.text, colorClasses.border),
    outline: cn(colorClasses.outline, colorClasses.text, colorClasses.border),
    subtle: cn(colorClasses.subtle, colorClasses.text, colorClasses.border),
  }

  const badge = (
    <Badge
      variant="secondary"
      className={cn(
        SIZE_CLASSES[size],
        variantClasses[variant],
        'rounded-md border font-medium inline-flex items-center whitespace-nowrap',
        isPending && 'animate-pulse',
        isCancelled && 'line-through',
        className
      )}
      role="status"
      aria-label={`Status: ${status.name}`}
      data-testid={testId}
    >
      {icon}
      <span className="truncate">{status.name}</span>
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
          <p className="text-sm">{getTooltipText(status.code, status.name)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

// ============================================================================
// LEGACY COMPONENT - Backwards Compatibility (Story 03.3)
// ============================================================================

/**
 * Legacy PO Status Badge for backwards compatibility
 * Uses fixed POStatus type from Story 03.3
 *
 * @deprecated Use POStatusBadge with configurable status object instead
 */
export function LegacyPOStatusBadge({
  status,
  className,
  size = 'default',
  showTooltip = false,
  approvalStatus,
}: LegacyPOStatusBadgeProps) {
  const config = PO_STATUS_CONFIG[status] || {
    label: status,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
  }

  // Map legacy size to new size
  const mappedSize: BadgeSize = size === 'default' ? 'md' : size

  // Convert to configurable status format
  const configurableStatus: ConfigurableStatus = {
    code: status,
    name: config.label,
    color: config.bgColor.replace('bg-', '').replace('-100', ''),
  }

  return (
    <POStatusBadge
      status={configurableStatus}
      size={mappedSize}
      variant="default"
      showTooltip={showTooltip}
      className={className}
    />
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default POStatusBadge
