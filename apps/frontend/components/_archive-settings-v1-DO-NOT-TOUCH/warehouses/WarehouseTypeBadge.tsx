/**
 * WarehouseTypeBadge Component
 * Story: 01.8 - Warehouse Management CRUD
 *
 * Displays warehouse type with color-coded badge
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { WAREHOUSE_TYPE_LABELS, WAREHOUSE_TYPE_COLORS, type WarehouseType } from '@/lib/types/warehouse'

interface WarehouseTypeBadgeProps {
  type: WarehouseType
}

export function WarehouseTypeBadge({ type }: WarehouseTypeBadgeProps) {
  const label = WAREHOUSE_TYPE_LABELS[type]
  const colors = WAREHOUSE_TYPE_COLORS[type]

  return (
    <Badge
      variant="secondary"
      className={`${colors.bg} ${colors.text} border-none`}
    >
      {label}
    </Badge>
  )
}
