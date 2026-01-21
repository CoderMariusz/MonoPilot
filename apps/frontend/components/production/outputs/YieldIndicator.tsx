'use client'

/**
 * YieldIndicator Component (Story 04.7a)
 *
 * Color-coded yield display with thresholds:
 * - Green: >= 95%
 * - Yellow: 80-94%
 * - Red: < 80%
 */

import { cn } from '@/lib/utils'

export interface YieldIndicatorProps {
  /** Yield percentage value (0-100+) */
  value: number | null
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show label text */
  showLabel?: boolean
  /** Optional trend indicator (+/-) */
  trend?: number | null
  /** Optional additional CSS classes */
  className?: string
}

/**
 * Yield thresholds for color coding (Story 04.7a)
 */
const YIELD_THRESHOLDS = {
  green: 95, // >= 95% green
  yellow: 80, // >= 80% yellow
  red: 0, // < 80% red
}

/**
 * Get yield color based on percentage
 */
function getYieldColor(value: number): 'green' | 'yellow' | 'red' {
  if (value >= YIELD_THRESHOLDS.green) return 'green'
  if (value >= YIELD_THRESHOLDS.yellow) return 'yellow'
  return 'red'
}

/**
 * Format yield for display
 */
function formatYield(value: number | null): string {
  if (value === null) return 'N/A'
  return `${value.toFixed(1)}%`
}

export function YieldIndicator({
  value,
  size = 'md',
  showLabel = false,
  trend,
  className,
}: YieldIndicatorProps) {
  const color = value !== null ? getYieldColor(value) : 'red'
  const displayValue = formatYield(value)

  // Color classes
  const colorClasses = {
    green: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      dot: 'bg-green-500',
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500',
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
    },
  }

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'px-1.5 py-0.5 text-xs',
      dot: 'h-1.5 w-1.5',
      trend: 'text-[10px]',
    },
    md: {
      container: 'px-2 py-1 text-sm',
      dot: 'h-2 w-2',
      trend: 'text-xs',
    },
    lg: {
      container: 'px-3 py-1.5 text-base',
      dot: 'h-2.5 w-2.5',
      trend: 'text-sm',
    },
  }

  // Labels based on color
  const labels = {
    green: 'Excellent',
    yellow: 'Below Target',
    red: 'Low Yield',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium',
        colorClasses[color].bg,
        colorClasses[color].text,
        colorClasses[color].border,
        'border',
        sizeClasses[size].container,
        className
      )}
      data-testid="yield-indicator"
      aria-label={`Yield: ${displayValue}${value !== null ? ` - ${labels[color]}` : ''}`}
    >
      {/* Color dot */}
      <span
        className={cn('rounded-full', sizeClasses[size].dot, colorClasses[color].dot)}
        aria-hidden="true"
      />

      {/* Value */}
      <span className="font-mono">{displayValue}</span>

      {/* Trend indicator */}
      {trend !== null && trend !== undefined && (
        <span
          className={cn(
            sizeClasses[size].trend,
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          )}
        >
          {trend > 0 ? `+${trend.toFixed(1)}%` : trend < 0 ? `${trend.toFixed(1)}%` : '0%'}
        </span>
      )}

      {/* Optional label */}
      {showLabel && value !== null && (
        <span className="text-xs opacity-75 ml-1">{labels[color]}</span>
      )}
    </div>
  )
}

export default YieldIndicator
