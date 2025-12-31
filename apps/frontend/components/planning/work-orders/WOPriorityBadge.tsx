/**
 * WO Priority Badge Component
 * Story 03.10: Work Order CRUD
 * Displays work order priority with visual indicator per PLAN-013
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { WOPriority } from '@/lib/types/work-order'
import { WO_PRIORITY_CONFIG } from '@/lib/types/work-order'

interface WOPriorityBadgeProps {
  priority: WOPriority
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'default' | 'lg'
}

export function WOPriorityBadge({
  priority,
  className,
  showLabel = true,
  size = 'default',
}: WOPriorityBadgeProps) {
  const config = WO_PRIORITY_CONFIG[priority] || {
    label: priority,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    showIndicator: false,
  }

  // Only render badge for high/critical priorities or when label explicitly requested
  if (!config.showIndicator && !showLabel) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        'font-medium border-0 inline-flex items-center gap-1',
        priority === 'critical' && 'font-bold',
        className
      )}
      aria-label={`Priority: ${config.label}`}
    >
      {config.showIndicator && (
        <AlertTriangle className={iconSizes[size]} />
      )}
      {showLabel && config.label}
    </Badge>
  )
}

/**
 * Inline priority indicator (icon only for high/critical)
 */
export function WOPriorityIndicator({
  priority,
  className,
}: {
  priority: WOPriority
  className?: string
}) {
  const config = WO_PRIORITY_CONFIG[priority]

  if (!config?.showIndicator) {
    return null
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        config.textColor,
        className
      )}
      aria-label={`Priority: ${config.label}`}
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </span>
  )
}

export default WOPriorityBadge
