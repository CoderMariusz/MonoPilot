'use client'

/**
 * AllergenMatrixPanel Component (Story 02.12)
 * AC-12.06 to AC-12.12: Products x Allergens heatmap grid
 *
 * Features:
 * - Product type filter dropdown
 * - Export PDF button
 * - Color-coded cells (red/yellow/green)
 * - Click cell to navigate
 * - Legend at bottom
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileDown, AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { TechnicalAllergenMatrixResponse, AllergenRelation } from '@/lib/types/dashboard'

interface AllergenMatrixPanelProps {
  data?: TechnicalAllergenMatrixResponse
  onCellClick?: (productId: string, allergenId: string) => void
  onExportPdf?: () => void
  onProductTypeChange?: (type: string | null) => void
  loading?: boolean
  error?: string
  onRetry?: () => void
}

// Color mapping for allergen relations
const relationColors = {
  contains: 'bg-red-500 hover:bg-red-600',
  may_contain: 'bg-yellow-400 hover:bg-yellow-500',
  free_from: 'bg-green-500 hover:bg-green-600'
}

// Skeleton for loading state
function AllergenMatrixSkeleton() {
  return (
    <Card className="h-full" data-testid="allergen-matrix-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Empty state
function AllergenMatrixEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No allergen data</h3>
      <p className="mt-1 text-sm text-gray-500">
        No allergen data available. Assign allergens to products.
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      )}
    </div>
  )
}

// Error state
function AllergenMatrixError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">Failed to load allergen matrix</h3>
      <p className="mt-1 text-sm text-gray-500">{error}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  )
}

export function AllergenMatrixPanel({
  data,
  onCellClick,
  onExportPdf,
  onProductTypeChange,
  loading,
  error,
  onRetry
}: AllergenMatrixPanelProps) {
  const router = useRouter()
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all')

  if (loading) {
    return <AllergenMatrixSkeleton />
  }

  if (error) {
    return (
      <Card className="h-full" data-testid="allergen-matrix-panel">
        <CardContent className="p-6">
          <AllergenMatrixError error={error} onRetry={onRetry} />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.products.length === 0 || data.allergens.length === 0) {
    return (
      <Card className="h-full" data-testid="allergen-matrix-panel">
        <CardContent className="p-6">
          <AllergenMatrixEmpty onRetry={onRetry} />
        </CardContent>
      </Card>
    )
  }

  const handleProductTypeChange = (value: string) => {
    setProductTypeFilter(value)
    onProductTypeChange?.(value === 'all' ? null : value)
  }

  const handleCellClick = (productId: string, allergenId: string) => {
    if (onCellClick) {
      onCellClick(productId, allergenId)
    } else {
      router.push(`/technical/products/${productId}/allergens`)
    }
  }

  return (
    <Card className="h-full" data-testid="allergen-matrix-panel">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg">Allergen Matrix</CardTitle>
          <div className="flex gap-2">
            <Select value={productTypeFilter} onValueChange={handleProductTypeChange}>
              <SelectTrigger className="w-[140px]" data-testid="product-type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="RM">Raw Materials</SelectItem>
                <SelectItem value="WIP">Work in Progress</SelectItem>
                <SelectItem value="FG">Finished Goods</SelectItem>
              </SelectContent>
            </Select>
            {onExportPdf && (
              <Button variant="outline" size="sm" onClick={onExportPdf}>
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Matrix Grid */}
        <div
          className="overflow-x-auto"
          data-testid="allergen-matrix-grid"
          role="grid"
          aria-label="Allergen matrix: products by allergens"
        >
          <table className="min-w-full border-collapse">
            <thead>
              <tr role="row">
                <th
                  className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                  role="columnheader"
                >
                  Product
                </th>
                {data.allergens.slice(0, 10).map((allergen) => (
                  <th
                    key={allergen.id}
                    className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b min-w-[60px]"
                    role="columnheader"
                    title={allergen.name}
                  >
                    {allergen.code.substring(0, 6)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.products.slice(0, 25).map((product, rowIndex) => (
                <tr key={product.id} role="row" className="hover:bg-gray-50">
                  <td
                    className="sticky left-0 z-10 bg-white px-3 py-2 text-sm text-gray-900 border-b whitespace-nowrap"
                  >
                    <span className="font-medium">{product.code}</span>
                    <span className="ml-2 text-gray-500 text-xs truncate max-w-[120px] inline-block align-middle">
                      {product.name}
                    </span>
                  </td>
                  {data.allergens.slice(0, 10).map((allergen) => {
                    const relation = product.allergen_relations[allergen.id]
                    const cellClass = relation === 'contains'
                      ? relationColors.contains
                      : relation === 'may_contain'
                      ? relationColors.may_contain
                      : relationColors.free_from

                    return (
                      <td
                        key={allergen.id}
                        className="px-1 py-1 border-b"
                        role="gridcell"
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className={cn(
                                  'w-full h-8 rounded cursor-pointer transition-colors',
                                  cellClass
                                )}
                                onClick={() => handleCellClick(product.id, allergen.id)}
                                data-testid="allergen-cell"
                                data-relation={relation || 'free_from'}
                                aria-label={`${product.code}, ${allergen.name}: ${
                                  relation === 'contains' ? 'Contains' :
                                  relation === 'may_contain' ? 'May contain' :
                                  'Free from'
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs">
                                {allergen.name}:{' '}
                                {relation === 'contains' ? 'Contains' :
                                 relation === 'may_contain' ? 'May Contain' :
                                 'Free From'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-red-500" aria-hidden="true" />
            <span>Contains</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-yellow-400" aria-hidden="true" />
            <span>May Contain</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-green-500" aria-hidden="true" />
            <span>Free From</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AllergenMatrixPanel
