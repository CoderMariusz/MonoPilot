'use client'

/**
 * DurationDisplay Component
 * Story: 04.3 - Operation Start/Complete
 *
 * Display expected vs actual duration with variance indicator.
 * Uses color + icon for accessibility (not color alone).
 */

import { CheckCircle, Clock, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DurationDisplayProps {
  /** Expected duration in minutes */
  expected: number | null
  /** Actual duration in minutes */
  actual: number | null
  /** Show variance indicator (default true) */
  showVariance?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CONFIG = {
  sm: { text: 'text-xs', icon: 12 },
  md: { text: 'text-sm', icon: 14 },
  lg: { text: 'text-base', icon: 16 },
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '-'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Calculate variance percentage
 */
function calculateVariancePercent(
  expected: number | null,
  actual: number | null
): number | null {
  if (!expected || expected === 0 || actual === null) return null
  return ((actual - expected) / expected) * 100
}

/**
 * Get variance color and icon based on percentage
 */
function getVarianceStyle(variancePercent: number | null): {
  color: string
  Icon: typeof Clock
  label: string
} {
  if (variancePercent === null) {
    return { color: 'text-gray-600', Icon: Clock, label: 'No variance' }
  }

  if (variancePercent <= 0) {
    return { color: 'text-green-600', Icon: CheckCircle, label: 'Under expected' }
  }

  if (variancePercent <= 10) {
    return { color: 'text-gray-600', Icon: Clock, label: 'Slightly over' }
  }

  if (variancePercent <= 25) {
    return { color: 'text-yellow-600', Icon: AlertTriangle, label: 'Moderately over' }
  }

  return { color: 'text-red-600', Icon: AlertCircle, label: 'Significantly over' }
}

export function DurationDisplay({
  expected,
  actual,
  showVariance = true,
  size = 'md',
}: DurationDisplayProps) {
  const sizeConfig = SIZE_CONFIG[size]
  const variancePercent = calculateVariancePercent(expected, actual)
  const { color, Icon, label } = getVarianceStyle(variancePercent)

  // Build aria-label for screen readers
  const ariaLabel = `Expected: ${formatDuration(expected)}, Actual: ${formatDuration(actual)}${
    variancePercent !== null
      ? `, ${variancePercent > 0 ? '+' : ''}${Math.round(variancePercent)}% ${label}`
      : ''
  }`

  return (
    <div
      className={cn('inline-flex items-center gap-2', sizeConfig.text)}
      aria-label={ariaLabel}
    >
      <span className="text-muted-foreground">
        Expected: {formatDuration(expected)}
      </span>
      <span className="text-muted-foreground">|</span>
      <span>Actual: {formatDuration(actual)}</span>

      {showVariance && variancePercent !== null && actual !== null && (
        <span className={cn('inline-flex items-center gap-1', color)}>
          <Icon size={sizeConfig.icon} aria-hidden="true" />
          <span>
            ({variancePercent > 0 ? '+' : ''}
            {Math.round(variancePercent)}% over)
          </span>
        </span>
      )}
    </div>
  )
}

export default DurationDisplay
