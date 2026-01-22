'use client'

/**
 * QualityStatusBadge Component
 * Story: 06.1 - Quality Status Types
 *
 * Color-coded status badge with icon for 7 QA status types.
 * Uses color + icon for accessibility (not color alone).
 *
 * Statuses:
 * - PENDING (gray/Clock): Awaiting inspection
 * - PASSED (green/CheckCircle): Meets specifications
 * - FAILED (red/XCircle): Does not meet specs
 * - HOLD (orange/Pause): Investigation required
 * - RELEASED (blue/Unlock): Approved after hold
 * - QUARANTINED (darkRed/AlertTriangle): Isolated pending review
 * - COND_APPROVED (yellow/AlertCircle): Limited use allowed
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
 */

import { Badge } from '@/components/ui/badge'
import {
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Unlock,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export type QualityStatus =
  | 'PENDING'
  | 'PASSED'
  | 'FAILED'
  | 'HOLD'
  | 'RELEASED'
  | 'QUARANTINED'
  | 'COND_APPROVED'

export interface QualityStatusBadgeProps {
  /** Quality status code */
  status: QualityStatus
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show icon alongside text */
  showIcon?: boolean
  /** Additional CSS classes */
  className?: string
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string | null
  /** Test ID for testing */
  testId?: string
}

// ============================================================================
// Status Configuration
// ============================================================================

interface StatusConfig {
  label: string
  description: string
  color: string
  bg: string
  text: string
  border: string
  Icon: LucideIcon
  allows_shipment: boolean
  allows_consumption: boolean
}

const STATUS_CONFIG: Record<QualityStatus, StatusConfig> = {
  PENDING: {
    label: 'Pending',
    description: 'Awaiting inspection',
    color: 'gray',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    Icon: Clock,
    allows_shipment: false,
    allows_consumption: false,
  },
  PASSED: {
    label: 'Passed',
    description: 'Meets specifications',
    color: 'green',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    Icon: CheckCircle,
    allows_shipment: true,
    allows_consumption: true,
  },
  FAILED: {
    label: 'Failed',
    description: 'Does not meet specs',
    color: 'red',
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    Icon: XCircle,
    allows_shipment: false,
    allows_consumption: false,
  },
  HOLD: {
    label: 'Hold',
    description: 'Investigation required',
    color: 'orange',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    Icon: Pause,
    allows_shipment: false,
    allows_consumption: false,
  },
  RELEASED: {
    label: 'Released',
    description: 'Approved for use after hold',
    color: 'blue',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    Icon: Unlock,
    allows_shipment: true,
    allows_consumption: true,
  },
  QUARANTINED: {
    label: 'Quarantined',
    description: 'Isolated pending review',
    color: 'darkRed',
    bg: 'bg-red-200',
    text: 'text-red-900',
    border: 'border-red-300',
    Icon: AlertTriangle,
    allows_shipment: false,
    allows_consumption: false,
  },
  COND_APPROVED: {
    label: 'Conditionally Approved',
    description: 'Limited use allowed',
    color: 'yellow',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    Icon: AlertCircle,
    allows_shipment: false,
    allows_consumption: true,
  },
}

const SIZE_CONFIG = {
  sm: { padding: 'px-2 py-0.5', font: 'text-xs', icon: 12 },
  md: { padding: 'px-2.5 py-1', font: 'text-sm', icon: 14 },
  lg: { padding: 'px-3 py-1.5', font: 'text-base', icon: 16 },
}

// ============================================================================
// Component
// ============================================================================

export function QualityStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
  loading = false,
  error = null,
  testId = 'quality-status-badge',
}: QualityStatusBadgeProps) {
  // Loading state
  if (loading) {
    const sizeClass = size === 'sm' ? 'h-5 w-16' : size === 'lg' ? 'h-8 w-28' : 'h-6 w-20'
    return (
      <Skeleton
        className={cn('rounded-md', sizeClass)}
        data-testid={`${testId}-loading`}
      />
    )
  }

  // Error state
  if (error) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-red-50 text-red-600 border-red-200',
          SIZE_CONFIG[size].padding,
          SIZE_CONFIG[size].font,
          'border font-medium inline-flex items-center gap-1',
          className
        )}
        data-testid={`${testId}-error`}
        role="alert"
        aria-label={`Error: ${error}`}
      >
        <AlertCircle className="flex-shrink-0" size={SIZE_CONFIG[size].icon} aria-hidden="true" />
        <span>Error</span>
      </Badge>
    )
  }

  // Validate status
  const config = STATUS_CONFIG[status]
  if (!config) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-gray-50 text-gray-600 border-gray-200',
          SIZE_CONFIG[size].padding,
          SIZE_CONFIG[size].font,
          'border font-medium inline-flex items-center gap-1',
          className
        )}
        data-testid={`${testId}-unknown`}
        role="status"
        aria-label="Unknown status"
      >
        <AlertCircle className="flex-shrink-0" size={SIZE_CONFIG[size].icon} aria-hidden="true" />
        <span>Unknown</span>
      </Badge>
    )
  }

  const { Icon } = config
  const sizeConfig = SIZE_CONFIG[size]

  return (
    <Badge
      variant="outline"
      className={cn(
        config.bg,
        config.text,
        config.border,
        sizeConfig.padding,
        sizeConfig.font,
        'border font-medium inline-flex items-center gap-1',
        className
      )}
      role="status"
      aria-label={`Quality Status: ${config.label}`}
      data-testid={testId}
    >
      {showIcon && (
        <Icon
          className="flex-shrink-0"
          size={sizeConfig.icon}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </Badge>
  )
}

// ============================================================================
// Helper Functions (exported for use in other components)
// ============================================================================

/**
 * Get status configuration
 */
export function getStatusConfig(status: QualityStatus): StatusConfig | undefined {
  return STATUS_CONFIG[status]
}

/**
 * Get all status configurations
 */
export function getAllStatusConfigs(): Record<QualityStatus, StatusConfig> {
  return STATUS_CONFIG
}

/**
 * Check if status allows shipment
 */
export function isShipmentAllowed(status: QualityStatus): boolean {
  return STATUS_CONFIG[status]?.allows_shipment ?? false
}

/**
 * Check if status allows consumption
 */
export function isConsumptionAllowed(status: QualityStatus): boolean {
  return STATUS_CONFIG[status]?.allows_consumption ?? false
}

export default QualityStatusBadge
