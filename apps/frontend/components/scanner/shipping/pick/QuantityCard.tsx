/**
 * Quantity Card Component (Story 07.10)
 * Displays quantity to pick and expected LP
 */

'use client'

import { cn } from '@/lib/utils'

interface QuantityCardProps {
  quantity_to_pick: number
  expected_lp: string
  className?: string
}

export function QuantityCard({ quantity_to_pick, expected_lp, className }: QuantityCardProps) {
  return (
    <div
      data-testid="quantity-card"
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4',
        className
      )}
    >
      <p className="text-sm text-gray-500 mb-1">Pick Quantity</p>
      <p
        className="text-3xl font-bold text-green-600"
        style={{ fontSize: '32px' }}
      >
        {quantity_to_pick}
      </p>
      <p className="text-base text-gray-500 mt-2" style={{ fontSize: '16px' }}>
        {expected_lp}
      </p>
    </div>
  )
}

export default QuantityCard
