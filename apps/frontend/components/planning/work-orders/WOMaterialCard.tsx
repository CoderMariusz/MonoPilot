/**
 * WO Material Card - Story 03.11a
 *
 * Mobile card layout for a single material
 * Used in responsive view on screens < 768px
 *
 * @module components/planning/work-orders/WOMaterialCard
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface WOMaterialCardProps {
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
 * Mobile card layout for a single material
 *
 * @param material - WO material data
 * @param showActions - Show action buttons (default: true)
 *
 * @example
 * ```tsx
 * <WOMaterialCard material={material} />
 * ```
 */
export function WOMaterialCard({
  material,
  showActions = true,
}: WOMaterialCardProps) {
  const consumptionPercent = getConsumptionPercent(material)
  const remainingQty = getRemainingQty(material)
  const productType = material.product?.product_type || 'RM'
  const isByProduct = material.is_by_product

  return (
    <Card
      data-testid={`wo-material-card-${material.sequence}`}
      className={cn(isByProduct && 'border-indigo-200 bg-indigo-50/30')}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              #{material.sequence}
            </span>
            <span>{material.material_name}</span>
          </div>
          <MaterialProductTypeBadge type={productType} />
        </CardTitle>
        {material.product?.code && (
          <p className="text-xs text-muted-foreground">{material.product.code}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isByProduct ? (
          <div className="flex items-center justify-between">
            <ByProductBadge yieldPercent={material.yield_percent} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Required:</span>
                <p className="font-medium">
                  {formatQty(material.required_qty, material.uom)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Reserved:</span>
                <p className="font-medium">
                  {formatQty(material.reserved_qty, material.uom)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Consumed:</span>
                <p className="font-medium">
                  {formatQty(material.consumed_qty, material.uom)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Remaining:</span>
                <p className="font-medium">
                  {formatQty(remainingQty, material.uom)}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Consumed</span>
                <span className="font-medium">{consumptionPercent.toFixed(0)}%</span>
              </div>
              <Progress
                value={consumptionPercent}
                className="h-2"
                aria-label={`${consumptionPercent.toFixed(0)}% consumed`}
              />
            </div>
          </>
        )}

        {showActions && (
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              aria-label="View material details"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
