/**
 * Capacity Indicator Component
 * Story: 01.9 - Location Hierarchy Management
 *
 * Visual capacity indicator with color states
 */

'use client'

import { Progress } from '@/components/ui/progress'

interface CapacityIndicatorProps {
  current: number
  max: number | null
  unit: 'pallets' | 'kg'
  size?: 'sm' | 'md'
}

export function CapacityIndicator({ current, max, unit, size = 'md' }: CapacityIndicatorProps) {
  // If no max limit, show unlimited
  if (max === null || max === 0) {
    return (
      <div className={size === 'sm' ? 'text-xs' : 'text-sm'}>
        <span className="text-muted-foreground">
          {current} {unit} (unlimited)
        </span>
      </div>
    )
  }

  const percent = Math.min(100, Math.round((current / max) * 100))

  // Color states: green (0-69%), yellow (70-89%), red (90-100%)
  const getColorClass = () => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getTextColorClass = () => {
    if (percent >= 90) return 'text-red-700'
    if (percent >= 70) return 'text-yellow-700'
    return 'text-green-700'
  }

  const getStatusText = () => {
    if (percent >= 90) return 'Full'
    if (percent >= 70) return 'Warning'
    return 'Normal'
  }

  return (
    <div className={`space-y-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">
          {current} / {max} {unit}
        </span>
        <span className={`font-medium ${getTextColorClass()}`}>
          {percent}%
        </span>
      </div>
      <div className="relative">
        <Progress
          value={percent}
          className="h-2"
          aria-label={`Capacity: ${percent}% (${current} of ${max} ${unit}) - ${getStatusText()}`}
        />
        <div
          className={`absolute inset-0 rounded-full ${getColorClass()} transition-all`}
          style={{ width: `${percent}%` }}
          role="presentation"
        />
      </div>
    </div>
  )
}
