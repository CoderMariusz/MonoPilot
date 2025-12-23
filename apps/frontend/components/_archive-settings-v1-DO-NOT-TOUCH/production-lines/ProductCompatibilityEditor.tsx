/**
 * Product Compatibility Editor Component
 * Story: 01.11 - Production Lines CRUD
 * Purpose: Checkbox list with search, Select All/Clear All
 */

'use client'

import { useState, useMemo } from 'react'
import { Search, CheckSquare, XSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Product } from '@/lib/types/production-line'

interface ProductCompatibilityEditorProps {
  availableProducts: Product[]
  selectedProductIds: string[]
  onChange: (productIds: string[]) => void
}

export function ProductCompatibilityEditor({
  availableProducts,
  selectedProductIds,
  onChange,
}: ProductCompatibilityEditorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Debounced search - filter products based on query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableProducts
    }

    const query = searchQuery.toLowerCase()
    return availableProducts.filter(
      (product) =>
        product.code.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
    )
  }, [searchQuery, availableProducts])

  // Check if all visible products are selected
  const allVisibleSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.includes(p.id))

  // Handle select all (only visible/filtered products)
  const handleSelectAll = () => {
    const visibleIds = filteredProducts.map((p) => p.id)
    const currentIds = new Set(selectedProductIds)

    // Add all visible products to selection
    visibleIds.forEach((id) => currentIds.add(id))
    onChange(Array.from(currentIds))
  }

  // Handle clear all
  const handleClearAll = () => {
    onChange([])
  }

  // Handle individual checkbox toggle
  const handleToggle = (productId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedProductIds, productId])
    } else {
      onChange(selectedProductIds.filter((id) => id !== productId))
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search products by code or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={allVisibleSelected || filteredProducts.length === 0}
          className="flex items-center gap-1.5"
        >
          <CheckSquare className="h-4 w-4" />
          Select All
          {searchQuery && ` (${filteredProducts.length})`}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          disabled={selectedProductIds.length === 0}
          className="flex items-center gap-1.5"
        >
          <XSquare className="h-4 w-4" />
          Clear All
        </Button>
      </div>

      {/* Info Text */}
      <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
        <p className="font-medium">Product Compatibility:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>
            <strong>No selection:</strong> Line can run ANY product (no restrictions)
          </li>
          <li>
            <strong>Selected products:</strong> Line can ONLY run selected products
          </li>
        </ul>
      </div>

      {/* Product List */}
      <ScrollArea className="h-[300px] border rounded-md">
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? (
              <>
                <p>No products found matching &quot;{searchQuery}&quot;</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <p>No products available</p>
                <p className="text-sm mt-1">Create products in Technical module</p>
              </>
            )}
          </div>
        )}

        <div className="p-4 space-y-3">
          {filteredProducts.map((product) => {
            const isChecked = selectedProductIds.includes(product.id)

            return (
              <div
                key={product.id}
                className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50"
              >
                <Checkbox
                  id={`product-${product.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    handleToggle(product.id, checked === true)
                  }
                  className="mt-0.5"
                />
                <label
                  htmlFor={`product-${product.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.code}</span>
                    {product.category && (
                      <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                        {product.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{product.name}</p>
                </label>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Selected Count */}
      {selectedProductIds.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedProductIds.length} product
          {selectedProductIds.length === 1 ? '' : 's'} selected
        </p>
      )}
    </div>
  )
}
