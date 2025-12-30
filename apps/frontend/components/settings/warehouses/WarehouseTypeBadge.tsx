/**
 * WarehouseTypeBadge Component
 * Story: 01.8 - Warehouses CRUD
 *
 * Displays warehouse type badge with color coding
 * 5 types: GENERAL=blue, RAW_MATERIALS=green, WIP=yellow, FINISHED_GOODS=purple, QUARANTINE=red
 */

'use client'

import { Badge } from '@/components/ui/badge'
import type { WarehouseType } from '@/lib/types/warehouse'
import { WAREHOUSE_TYPE_LABELS, WAREHOUSE_TYPE_COLORS } from '@/lib/types/warehouse'
import { Warehouse, Package, Factory, Box, ShieldAlert } from 'lucide-react'

const WAREHOUSE_TYPE_ICONS: Record<WarehouseType, typeof Warehouse> = {
  GENERAL: Warehouse,
  RAW_MATERIALS: Package,
  WIP: Factory,
  FINISHED_GOODS: Box,
  QUARANTINE: ShieldAlert,
}

interface WarehouseTypeBadgeProps {
  type: WarehouseType
  showIcon?: boolean
}

export function WarehouseTypeBadge({ type, showIcon = true }: WarehouseTypeBadgeProps) {
  const Icon = WAREHOUSE_TYPE_ICONS[type]
  const { bg, text } = WAREHOUSE_TYPE_COLORS[type]
  const label = WAREHOUSE_TYPE_LABELS[type]

  return (
    <Badge
      variant="secondary"
      className={`${bg} ${text} border-none font-medium`}
      aria-label={`Warehouse type: ${label}`}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" aria-hidden="true" />}
      <span>{label}</span>
      <span className="sr-only">{` - ${type} warehouse`}</span>
    </Badge>
  )
}
