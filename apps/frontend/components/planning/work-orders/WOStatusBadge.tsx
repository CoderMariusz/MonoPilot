/**
 * WO Status Badge Component
 * Story 03.10: Work Order CRUD
 * Displays work order status with color coding per PLAN-013
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { WOStatus } from '@/lib/types/work-order'
import { WO_STATUS_CONFIG } from '@/lib/types/work-order'

interface WOStatusBadgeProps {
  status: WOStatus
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function WOStatusBadge({
  status,
  className,
  size = 'default',
}: WOStatusBadgeProps) {
  const config = WO_STATUS_CONFIG[status] || {
    label: status,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        'font-medium border-0',
        className
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </Badge>
  )
}

export default WOStatusBadge
