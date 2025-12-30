/**
 * WarehouseStatusBadge Component
 * Story: 01.8 - Warehouses CRUD
 *
 * Displays warehouse status badge with color coding
 * 2 statuses: active=green, disabled=gray
 */

'use client'

import { Badge } from '@/components/ui/badge'

type WarehouseStatus = 'active' | 'disabled'

const STATUS_CONFIG: Record<WarehouseStatus, { bg: string; text: string; label: string }> = {
  active: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'Active',
  },
  disabled: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    label: 'Disabled',
  },
}

interface WarehouseStatusBadgeProps {
  status: WarehouseStatus
}

export function WarehouseStatusBadge({ status }: WarehouseStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge
      variant="secondary"
      className={`${config.bg} ${config.text} border-none font-medium`}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </Badge>
  )
}
