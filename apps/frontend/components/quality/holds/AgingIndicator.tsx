/**
 * Aging Indicator Component
 * Story: 06.2 - Quality Holds CRUD
 * AC-2.23: Yellow warning icon for high priority holds >48 hours
 * AC-2.24: Red critical icon for critical priority holds >24 hours
 * AC-2.26: Banner for holds >48 hours old
 *
 * Displays aging warnings with tooltip information
 */

'use client'

import { AlertTriangle, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Priority } from '@/lib/validation/quality-hold-validation'

type AgingStatus = 'normal' | 'warning' | 'critical'

interface AgingIndicatorProps {
  agingHours: number
  priority: Priority
  agingStatus?: AgingStatus
  showTooltip?: boolean
  className?: string
}

/**
 * Calculate aging status based on priority and hours
 */
export function calculateAgingStatus(priority: Priority, agingHours: number): AgingStatus {
  const thresholds: Record<Priority, { warning: number; critical: number }> = {
    critical: { warning: 12, critical: 24 },
    high: { warning: 24, critical: 48 },
    medium: { warning: 48, critical: 72 },
    low: { warning: 72, critical: 168 }, // 7 days
  }

  const threshold = thresholds[priority]

  if (agingHours >= threshold.critical) {
    return 'critical'
  }
  if (agingHours >= threshold.warning) {
    return 'warning'
  }
  return 'normal'
}

/**
 * Format aging hours for display
 */
export function formatAgingTime(hours: number): string {
  if (hours < 1) {
    return '< 1 hour'
  }
  if (hours < 24) {
    return `${Math.round(hours)} hour${hours >= 2 ? 's' : ''}`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = Math.round(hours % 24)
  if (remainingHours === 0) {
    return `${days} day${days > 1 ? 's' : ''}`
  }
  return `${days} day${days > 1 ? 's' : ''}, ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`
}

export function AgingIndicator({
  agingHours,
  priority,
  agingStatus: providedStatus,
  showTooltip = true,
  className,
}: AgingIndicatorProps) {
  const status = providedStatus || calculateAgingStatus(priority, agingHours)

  if (status === 'normal') {
    return (
      <div
        className={cn('flex items-center gap-1 text-gray-500', className)}
        title={showTooltip ? `Hold age: ${formatAgingTime(agingHours)}` : undefined}
      >
        <Clock className="h-4 w-4" />
        <span className="text-sm">{formatAgingTime(agingHours)}</span>
      </div>
    )
  }

  if (status === 'warning') {
    return (
      <div
        className={cn('flex items-center gap-1 text-yellow-600', className)}
        title={showTooltip ? `Hold aging: ${formatAgingTime(agingHours)}` : undefined}
        role="alert"
        aria-label={`Warning: Hold has been active for ${formatAgingTime(agingHours)}`}
      >
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">{formatAgingTime(agingHours)}</span>
      </div>
    )
  }

  // Critical
  return (
    <div
      className={cn('flex items-center gap-1 text-red-600', className)}
      title={showTooltip ? `Hold aging: ${formatAgingTime(agingHours)} (CRITICAL)` : undefined}
      role="alert"
      aria-label={`Critical: Hold has been active for ${formatAgingTime(agingHours)}`}
    >
      <AlertCircle className="h-4 w-4" />
      <span className="text-sm font-medium">{formatAgingTime(agingHours)}</span>
    </div>
  )
}

/**
 * Aging Alert Banner
 * AC-2.26: Banner for holds >48 hours old
 */
interface AgingAlertBannerProps {
  agingHours: number
  priority: Priority
  className?: string
}

export function AgingAlertBanner({ agingHours, priority, className }: AgingAlertBannerProps) {
  const status = calculateAgingStatus(priority, agingHours)

  if (status === 'normal') {
    return null
  }

  const days = Math.floor(agingHours / 24)

  if (status === 'warning') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800',
          className
        )}
        role="alert"
      >
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          This hold has been active for{' '}
          <span className="font-semibold">{formatAgingTime(agingHours)}</span>. Please review and
          release or escalate.
        </p>
      </div>
    )
  }

  // Critical
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm">
        <span className="font-bold">CRITICAL:</span> This hold has been active for{' '}
        <span className="font-semibold">{formatAgingTime(agingHours)}</span>. Immediate action
        required.
      </p>
    </div>
  )
}

/**
 * Compact aging indicator for table rows
 */
interface AgingIndicatorCompactProps {
  agingHours: number
  priority: Priority
  className?: string
}

export function AgingIndicatorCompact({ agingHours, priority, className }: AgingIndicatorCompactProps) {
  const status = calculateAgingStatus(priority, agingHours)

  if (status === 'normal') {
    return (
      <span
        className={cn('text-sm text-gray-500', className)}
        title={`Hold age: ${formatAgingTime(agingHours)}`}
      >
        {formatAgingTime(agingHours)}
      </span>
    )
  }

  if (status === 'warning') {
    return (
      <span
        className={cn('inline-flex items-center gap-1 text-sm font-medium text-yellow-600', className)}
        title={`Hold aging: ${formatAgingTime(agingHours)}`}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        {formatAgingTime(agingHours)}
      </span>
    )
  }

  // Critical
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-sm font-medium text-red-600', className)}
      title={`Hold aging: ${formatAgingTime(agingHours)} (CRITICAL)`}
    >
      <AlertCircle className="h-3.5 w-3.5" />
      {formatAgingTime(agingHours)}
    </span>
  )
}
