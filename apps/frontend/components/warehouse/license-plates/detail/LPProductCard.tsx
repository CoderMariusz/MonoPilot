/**
 * LP Product Card Component
 * Story 05.6: LP Detail Page
 *
 * Product section - name, code, qty, UoM
 */

import React from 'react'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { LPFieldLabel } from './LPFieldLabel'

interface LPProductCardProps {
  product: {
    id: string
    name: string
    code: string
  }
  quantity: number
  uom: string
  catchWeightKg: number | null
}

export function LPProductCard({ product, quantity, uom, catchWeightKg }: LPProductCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="product-card">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">Product</h3>
      </div>

      <div className="space-y-4">
        <LPFieldLabel
          label="Product"
          value={
            <Link
              href={`/technical/products/${product.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
              data-testid="link-product"
            >
              {product.name}
            </Link>
          }
        />

        <LPFieldLabel label="Product Code" value={product.code} />

        <LPFieldLabel
          label="Quantity"
          value={
            <div>
              <div className="font-medium">
                {quantity.toFixed(1)} {uom}
              </div>
              <div
                className="mt-2 w-full bg-gray-200 rounded-full h-2"
                role="progressbar"
                aria-valuenow={100}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          }
        />

        {catchWeightKg !== null && (
          <LPFieldLabel
            label="Catch Weight"
            value={<span data-testid="catch-weight">{catchWeightKg.toFixed(1)} kg</span>}
          />
        )}
      </div>
    </div>
  )
}
