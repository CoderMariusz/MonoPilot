/**
 * WO Material Row - Story 03.11a
 *
 * Single material row in the materials table
 *
 * @module components/planning/work-orders/WOMaterialRow
 */

'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { WOMaterial } from '@/lib/types/wo-materials'
import {
  getConsumptionPercent,
  getRemainingQty,
} from '@/lib/types/wo-materials'
import { MaterialProductTypeBadge } from './MaterialProductTypeBadge'
import { ByProductBadge } from './ByProductBadge'

interface WOMaterialRowProps {
  material: WOMaterial
  showActions?: boolean
}

/**
 * Format quantity with UoM
 */
function formatQty(qty: number, uom: string): string {
  const formatted = qty.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })
  return `${formatted} ${uom}`
}

/**
 * Get consumption status color
 */
function getStatusColor(percent: number): string {
  if (percent >= 100) return 'bg-green-500'
  if (percent >= 50) return 'bg-blue-500'
  if (percent > 0) return 'bg-yellow-500'
  return 'bg-gray-300'
}

/**
 * Single material row component
 *
 * @param material - WO material data
 * @param showActions - Show action buttons (default: true)
 *
 * @example
 * ```tsx
 * <WOMaterialRow material={material} />
 * ```
 */
export function WOMaterialRow({
  material,
  showActions = true,
}: WOMaterialRowProps) {
  const consumptionPercent = getConsumptionPercent(material)
  const remainingQty = getRemainingQty(material)
  const productType = material.product?.product_type || 'RM'

  const isByProduct = material.is_by_product

  return (
    <TableRow
      data-testid={`wo-material-row-${material.sequence}`}
      className={cn(isByProduct && 'bg-indigo-50/50')}
    >
      {/* Sequence */}
      <TableCell
        className="font-medium text-center w-12"
        data-testid="sequence"
      >
        {material.sequence}
      </TableCell>

      {/* Material */}
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium" data-testid="material-name">
              {material.material_name}
            </span>
            <MaterialProductTypeBadge type={productType} />
            {isByProduct && (
              <ByProductBadge yieldPercent={material.yield_percent} />
            )}
          </div>
          {material.product?.code && (
            <span className="text-xs text-muted-foreground">
              {material.product.code}
            </span>
          )}
        </div>
      </TableCell>

      {/* Required */}
      <TableCell data-testid="required-qty">
        {isByProduct ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          formatQty(material.required_qty, material.uom)
        )}
      </TableCell>

      {/* Reserved */}
      <TableCell>
        {isByProduct ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          formatQty(material.reserved_qty, material.uom)
        )}
      </TableCell>

      {/* Consumed */}
      <TableCell>
        {isByProduct ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          <div className="flex flex-col gap-1">
            <span>{formatQty(material.consumed_qty, material.uom)}</span>
            <div className="flex items-center gap-2">
              <Progress
                value={consumptionPercent}
                className={cn('h-2 w-20', getStatusColor(consumptionPercent))}
                aria-label={`${consumptionPercent.toFixed(0)}% consumed`}
              />
              <span className="text-xs text-muted-foreground">
                {consumptionPercent.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </TableCell>

      {/* Remaining */}
      <TableCell>
        {isByProduct ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          formatQty(remainingQty, material.uom)
        )}
      </TableCell>

      {/* Status - hidden on tablet */}
      <TableCell className="hidden lg:table-cell">
        {isByProduct ? (
          <span className="text-xs text-indigo-600">By-product</span>
        ) : material.scrap_percent > 0 ? (
          <span className="text-xs text-muted-foreground">
            Scrap: {material.scrap_percent}%
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Actions */}
      {showActions && (
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="View material details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  )
}
