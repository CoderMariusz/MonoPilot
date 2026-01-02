/**
 * PO Status Badge Component
 * Story 03.3: PO CRUD + Lines
 * Displays purchase order status with color coding per PLAN-004
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { POStatus } from '@/lib/types/purchase-order'
import { PO_STATUS_CONFIG } from '@/lib/types/purchase-order'

interface POStatusBadgeProps {
  status: POStatus
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function POStatusBadge({
  status,
  className,
  size = 'default',
}: POStatusBadgeProps) {
  const config = PO_STATUS_CONFIG[status] || {
    label: status,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
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

export default POStatusBadge
