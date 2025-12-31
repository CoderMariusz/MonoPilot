/**
 * By-Product Badge - Story 03.11a
 *
 * Badge indicating by-product item with optional yield percentage
 *
 * @module components/planning/work-orders/ByProductBadge
 */

'use client'

import { cn } from '@/lib/utils'
import { ArrowRightLeft } from 'lucide-react'

interface ByProductBadgeProps {
  yieldPercent?: number | null
  className?: string
}

/**
 * Badge component for by-product items
 *
 * @param yieldPercent - Yield percentage (optional)
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <ByProductBadge />
 * <ByProductBadge yieldPercent={2.5} />
 * ```
 */
export function ByProductBadge({
  yieldPercent,
  className,
}: ByProductBadgeProps) {
  const formattedYield =
    yieldPercent != null ? yieldPercent.toFixed(1) : null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        'bg-indigo-100 text-indigo-800 border border-indigo-200',
        className
      )}
      data-testid="by-product-badge"
      aria-label={
        formattedYield
          ? `By-product with ${formattedYield}% yield`
          : 'By-product'
      }
    >
      <ArrowRightLeft className="h-3 w-3" aria-hidden="true" />
      <span>By-product</span>
      {formattedYield && (
        <span
          className="text-indigo-600"
          data-testid="yield-percent"
        >
          ({formattedYield}%)
        </span>
      )}
    </span>
  )
}
