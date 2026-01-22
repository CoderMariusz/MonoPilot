/**
 * SO Status Badge Component
 * Story 07.2: Sales Orders Core
 *
 * Displays sales order status with appropriate color and icon
 */

'use client'

import { Badge } from '@/components/ui/badge'
import {
  FileEdit,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
  PauseCircle,
  Package,
  Box,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SOStatus } from '@/lib/services/sales-order-service'

interface SOStatusBadgeProps {
  status: SOStatus
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const STATUS_CONFIG: Record<
  SOStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    icon: FileEdit,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    icon: CheckCircle,
  },
  on_hold: {
    label: 'On Hold',
    color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    icon: PauseCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 hover:bg-red-100',
    icon: XCircle,
  },
  allocated: {
    label: 'Allocated',
    color: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    icon: Package,
  },
  picking: {
    label: 'Picking',
    color: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    icon: Truck,
  },
  packing: {
    label: 'Packing',
    color: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    icon: Box,
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-green-100 text-green-800 hover:bg-green-100',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    icon: PackageCheck,
  },
}

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
  lg: 'text-base px-2.5 py-1',
}

const ICON_SIZES = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
}

export function SOStatusBadge({
  status,
  className,
  showIcon = true,
  size = 'md',
}: SOStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-0 font-medium',
        config.color,
        SIZE_CLASSES[size],
        className
      )}
      data-testid={`so-status-badge-${status}`}
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && <Icon className={cn(ICON_SIZES[size], 'mr-1')} aria-hidden="true" />}
      {config.label}
    </Badge>
  )
}

export default SOStatusBadge
