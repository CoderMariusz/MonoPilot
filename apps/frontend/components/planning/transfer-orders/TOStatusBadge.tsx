/**
 * TO Status Badge Component
 * Story 03.8: Transfer Orders CRUD + Lines
 * Displays transfer order status with color coding per PLAN-010
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TOStatus } from '@/lib/types/transfer-order'
import { TO_STATUS_LABELS, TO_STATUS_COLORS } from '@/lib/types/transfer-order'

interface TOStatusBadgeProps {
  status: TOStatus
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function TOStatusBadge({
  status,
  className,
  size = 'default',
}: TOStatusBadgeProps) {
  const label = TO_STATUS_LABELS[status] || status
  const colors = TO_STATUS_COLORS[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
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
        colors.bg,
        colors.text,
        sizeClasses[size],
        'font-medium border-0 capitalize',
        className
      )}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {label}
    </Badge>
  )
}

export default TOStatusBadge
