/**
 * Variance Indicator Component (Story 04.6e)
 * Visual indicator for material consumption variance
 *
 * Displays variance percentage with color coding:
 * - 0%: Green (exact match) - CheckCircle
 * - 1-10%: Yellow (acceptable) - AlertTriangle
 * - >10%: Red (high variance) - XCircle
 *
 * Also handles negative variance (under-consumption) as green.
 */

'use client'

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VarianceIndicatorProps {
  variancePercent: number | null | undefined
  size?: 'sm' | 'md'
}

/**
 * Get variance status based on percentage threshold
 */
function getVarianceStatus(variance: number): {
  status: 'exact' | 'acceptable' | 'high'
  color: 'green' | 'yellow' | 'red'
} {
  // Negative variance (under-consumption) is always green
  if (variance <= 0) {
    return { status: 'exact', color: 'green' }
  }

  // 1-10% is acceptable (yellow)
  if (variance > 0 && variance <= 10) {
    return { status: 'acceptable', color: 'yellow' }
  }

  // >10% is high variance (red)
  return { status: 'high', color: 'red' }
}

/**
 * Format variance percentage for display
 */
function formatVariance(variance: number): string {
  // Handle zero
  if (variance === 0) {
    return '0%'
  }

  // Round to 1 decimal place
  const rounded = Math.round(variance * 10) / 10

  // Add + prefix for positive values
  if (rounded > 0) {
    return `+${rounded}%`
  }

  // Negative values already have minus sign
  return `${rounded}%`
}

/**
 * Get aria-label for accessibility
 */
function getAriaLabel(variance: number, status: string): string {
  if (variance === 0 || variance < 0) {
    return `Variance: ${variance}% - exact match`
  }

  if (status === 'high') {
    return `Variance: ${variance}% - high variance`
  }

  return `Variance: ${variance}% - acceptable`
}

export function VarianceIndicator({ variancePercent, size = 'md' }: VarianceIndicatorProps) {
  // Handle null/undefined as 0%
  const variance = variancePercent ?? 0

  const { status, color } = getVarianceStatus(variance)
  const formattedVariance = formatVariance(variance)
  const ariaLabel = getAriaLabel(variance, status)

  // Color classes
  const colorClasses = {
    green: {
      text: 'text-green-600',
      bg: 'bg-green-50',
    },
    yellow: {
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    red: {
      text: 'text-red-600',
      bg: 'bg-red-50',
    },
  }

  // Size classes
  const sizeClasses = {
    sm: {
      text: 'text-xs',
      icon: 'h-3 w-3',
      padding: 'px-1.5 py-0.5',
    },
    md: {
      text: 'text-sm',
      icon: 'h-4 w-4',
      padding: 'px-2 py-1',
    },
  }

  // Get icon based on status
  const Icon = status === 'exact' ? CheckCircle : status === 'acceptable' ? AlertTriangle : XCircle
  const iconName = status === 'exact' ? 'check-circle' : status === 'acceptable' ? 'alert-triangle' : 'x-circle'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-mono',
        colorClasses[color].text,
        colorClasses[color].bg,
        sizeClasses[size].text,
        sizeClasses[size].padding
      )}
      data-testid="variance-indicator"
      aria-label={ariaLabel}
    >
      <Icon
        className={cn(sizeClasses[size].icon)}
        data-testid="variance-icon"
        data-icon={iconName}
        aria-hidden="true"
      />
      <span>{formattedVariance}</span>
    </div>
  )
}
