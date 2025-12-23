/**
 * Production Line Status Badge Component
 * Story: 01.11 - Production Lines CRUD
 * Purpose: Display status indicator with color coding
 */

import { Badge } from '@/components/ui/badge'
import type { ProductionLineStatus } from '@/lib/types/production-line'
import {
  PRODUCTION_LINE_STATUS_LABELS,
  PRODUCTION_LINE_STATUS_COLORS,
} from '@/lib/types/production-line'

interface ProductionLineStatusBadgeProps {
  status: ProductionLineStatus
  className?: string
}

export function ProductionLineStatusBadge({
  status,
  className,
}: ProductionLineStatusBadgeProps) {
  const colors = PRODUCTION_LINE_STATUS_COLORS[status]
  const label = PRODUCTION_LINE_STATUS_LABELS[status]

  return (
    <Badge
      variant="outline"
      className={`${colors.bg} ${colors.text} border-0 ${className || ''}`}
    >
      {label}
    </Badge>
  )
}
