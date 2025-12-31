/**
 * Material Product Type Badge - Story 03.11a
 *
 * Color-coded badge showing product type (RM, ING, PKG, WIP, FG)
 *
 * @module components/planning/work-orders/MaterialProductTypeBadge
 */

'use client'

import { cn } from '@/lib/utils'

interface MaterialProductTypeBadgeProps {
  type: string
  className?: string
}

/**
 * Product type color configuration
 */
const PRODUCT_TYPE_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  RM: {
    label: 'RM',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  ING: {
    label: 'ING',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  PKG: {
    label: 'PKG',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  WIP: {
    label: 'WIP',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  FG: {
    label: 'FG',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
}

/**
 * Badge component for material product type
 *
 * @param type - Product type code (RM, ING, PKG, WIP, FG)
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <MaterialProductTypeBadge type="RM" />
 * <MaterialProductTypeBadge type="ING" />
 * ```
 */
export function MaterialProductTypeBadge({
  type,
  className,
}: MaterialProductTypeBadgeProps) {
  const config = PRODUCT_TYPE_CONFIG[type] || {
    label: type,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border',
        config.className,
        className
      )}
      aria-label={`Product type: ${config.label}`}
    >
      {config.label}
    </span>
  )
}
