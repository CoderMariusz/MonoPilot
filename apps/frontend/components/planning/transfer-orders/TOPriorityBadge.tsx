/**
 * TO Priority Badge Component
 * Story 03.8: Transfer Orders CRUD + Lines
 * Displays transfer order priority with color coding per PLAN-010
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TOPriority } from '@/lib/types/transfer-order'
import { TO_PRIORITY_LABELS, TO_PRIORITY_COLORS } from '@/lib/types/transfer-order'

interface TOPriorityBadgeProps {
  priority: TOPriority
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function TOPriorityBadge({
  priority,
  className,
  size = 'default',
}: TOPriorityBadgeProps) {
  const label = TO_PRIORITY_LABELS[priority] || priority
  const colors = TO_PRIORITY_COLORS[priority] || {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
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
      aria-label={`Priority: ${label}`}
    >
      {label}
    </Badge>
  )
}

export default TOPriorityBadge
