/**
 * Product Card Component (Story 07.10)
 * Displays product details for pick line
 */

'use client'

import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: {
    name: string
    sku: string
    lot: string
    bbd?: string
  }
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <div
      data-testid="product-card"
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4',
        className
      )}
    >
      <p className="text-2xl font-bold text-gray-900" style={{ fontSize: '24px' }}>
        {product.name}
      </p>
      <p className="text-base text-gray-500 mt-1" style={{ fontSize: '16px' }}>
        {product.sku}
      </p>
      <div className="flex gap-4 mt-2">
        <p className="text-base text-gray-700" style={{ fontSize: '16px' }}>
          Lot: {product.lot}
        </p>
        {product.bbd && (
          <p className="text-base text-gray-700" style={{ fontSize: '16px' }}>
            BBD: {product.bbd}
          </p>
        )}
      </div>
    </div>
  )
}

export default ProductCard
