/**
 * Pick Line Card Component (Story 07.10)
 * Main card showing current pick line (location, product, qty, LP)
 */

'use client'

import { cn } from '@/lib/utils'
import { ProgressBar } from './ProgressBar'
import { LocationCard } from './LocationCard'
import { ProductCard } from './ProductCard'
import { QuantityCard } from './QuantityCard'
import type { PickLineDetail, PickProgress } from '@/lib/types/scanner-pick'

interface PickLineCardProps {
  pickLine: PickLineDetail
  progress: PickProgress
  className?: string
}

export function PickLineCard({ pickLine, progress, className }: PickLineCardProps) {
  return (
    <div
      className={cn('flex flex-col gap-4', className)}
    >
      {/* Progress indicator */}
      <div data-testid="pick-line-progress">
        <p className="text-sm font-medium text-gray-700 mb-1">
          Line {pickLine.pick_sequence} of {progress.total_lines}
        </p>
        <ProgressBar
          total_lines={progress.total_lines}
          picked_lines={progress.picked_lines}
          short_lines={progress.short_lines}
        />
      </div>

      {/* Location card */}
      <LocationCard
        location={{
          zone: pickLine.location.zone,
          path: pickLine.location.path || pickLine.location.code,
        }}
      />

      {/* Product card */}
      <ProductCard
        product={{
          name: pickLine.product.name,
          sku: pickLine.product.sku,
          lot: pickLine.lot_number || 'N/A',
          bbd: pickLine.bbd,
        }}
      />

      {/* Quantity card */}
      <QuantityCard
        quantity_to_pick={pickLine.quantity_to_pick}
        expected_lp={pickLine.expected_lp || 'Any LP'}
      />
    </div>
  )
}

export default PickLineCard
