'use client'

/**
 * CostTrendIndicator Component (Story 02.15)
 * Reusable trend arrow indicator with color coding
 */

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface CostTrendIndicatorProps {
  /** Trend value (positive = up, negative = down, 0 = neutral) */
  value: number
  /** Whether to show the percentage value */
  showValue?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Custom className */
  className?: string
}

const sizeConfig = {
  sm: { icon: 'h-3 w-3', text: 'text-xs' },
  md: { icon: 'h-4 w-4', text: 'text-sm' },
  lg: { icon: 'h-5 w-5', text: 'text-base' },
}

export function CostTrendIndicator({
  value,
  showValue = true,
  size = 'md',
  className,
}: CostTrendIndicatorProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  const colorClass = isPositive
    ? 'text-red-500'
    : isNegative
      ? 'text-green-500'
      : 'text-gray-500'

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  const config = sizeConfig[size]

  return (
    <span
      className={cn('inline-flex items-center gap-1', colorClass, className)}
      aria-label={`Trend: ${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
    >
      <Icon className={config.icon} aria-hidden="true" />
      {showValue && (
        <span className={config.text}>
          {value > 0 ? '+' : ''}
          {value.toFixed(1)}%
        </span>
      )}
    </span>
  )
}
