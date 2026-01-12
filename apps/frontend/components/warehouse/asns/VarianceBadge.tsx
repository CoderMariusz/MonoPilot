/**
 * VarianceBadge Component (Story 05.9)
 * Purpose: Color-coded badge showing variance status (under/over/exact)
 */

import { Badge } from '@/components/ui/badge'
import { Check, TrendingDown, TrendingUp } from 'lucide-react'
import type { VarianceIndicator } from '@/lib/types/asn-receive'

interface VarianceBadgeProps {
  variance: number
  expectedQty: number
  showPercent?: boolean
}

export function VarianceBadge({ variance, expectedQty, showPercent = true }: VarianceBadgeProps) {
  // Calculate variance percentage
  const variancePercent = expectedQty > 0 ? (variance / expectedQty) * 100 : 0

  // Determine indicator
  let indicator: VarianceIndicator
  if (variance === 0) {
    indicator = 'exact'
  } else if (variance < 0) {
    indicator = 'under'
  } else {
    indicator = 'over'
  }

  // Color classes
  const badgeClasses = {
    under: 'bg-red-100 text-red-800 border-red-200',
    over: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    exact: 'bg-green-100 text-green-800 border-green-200',
  }

  // Icon
  const Icon = {
    under: TrendingDown,
    over: TrendingUp,
    exact: Check,
  }[indicator]

  // Text format
  if (indicator === 'exact') {
    return (
      <Badge
        className={`${badgeClasses.exact} inline-flex items-center gap-1 border`}
        data-testid="variance-badge-exact"
      >
        <Icon className="h-3 w-3" />
        <span>Exact match</span>
      </Badge>
    )
  }

  const sign = variance > 0 ? '+' : ''
  const unitsText = `${sign}${variance} units`
  // Show 1 decimal for percent if variance has decimals, otherwise round
  const hasDecimals = variance % 1 !== 0
  const percentText = showPercent
    ? `(${sign}${hasDecimals ? variancePercent.toFixed(1) : Math.round(variancePercent)}%)`
    : null

  return (
    <Badge
      className={`${badgeClasses[indicator]} inline-flex items-center gap-1 border`}
      data-testid={`variance-badge-${indicator}`}
    >
      <Icon className="h-3 w-3" />
      <span>{unitsText}</span>
      {percentText && <span>{percentText}</span>}
    </Badge>
  )
}
