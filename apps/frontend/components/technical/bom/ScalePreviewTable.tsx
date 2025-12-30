/**
 * ScalePreviewTable Component (Story 02.14)
 * Shows scaled quantities in comparison format
 * FR-2.35: BOM Scaling preview
 *
 * Features:
 * - Original vs New quantity columns
 * - Highlight rounded values
 * - Show scale factor applied
 * - Warning indicators for significant changes
 * - Keyboard accessible table
 */

'use client'

import React from 'react'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ScaledItem } from '@/lib/types/bom-advanced'

// ========================================
// Props Interface
// ========================================

export interface ScalePreviewTableProps {
  /** Scaled items to display */
  items: ScaledItem[]
  /** Original batch size */
  originalBatchSize: number
  /** New batch size after scaling */
  newBatchSize: number
  /** Scale factor applied */
  scaleFactor: number
  /** Additional className */
  className?: string
}

// ========================================
// ScalePreviewTable Component
// ========================================

export function ScalePreviewTable({
  items,
  originalBatchSize,
  newBatchSize,
  scaleFactor,
  className,
}: ScalePreviewTableProps) {
  // Calculate percentage change
  const percentChange = ((scaleFactor - 1) * 100).toFixed(1)
  const isIncrease = scaleFactor > 1
  const isDecrease = scaleFactor < 1

  // Count rounded items
  const roundedCount = items.filter(item => item.rounded).length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Scale Summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-500">Original</p>
          <p className="font-semibold text-lg">{originalBatchSize.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-gray-400" />
          <Badge
            variant={isIncrease ? 'default' : isDecrease ? 'secondary' : 'outline'}
            className={cn(
              'text-sm',
              isIncrease && 'bg-green-500',
              isDecrease && 'bg-orange-500'
            )}
          >
            {scaleFactor.toFixed(3)}x
          </Badge>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">New</p>
          <p className="font-semibold text-lg">{newBatchSize.toLocaleString()}</p>
        </div>
      </div>

      {/* Rounding Warning */}
      {roundedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">
            {roundedCount} item{roundedCount > 1 ? 's' : ''} had quantities rounded due to decimal precision
          </span>
        </div>
      )}

      {/* Items Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[40%]">Component</TableHead>
              <TableHead className="text-right w-[20%]">Original</TableHead>
              <TableHead className="text-right w-[20%]">Scaled</TableHead>
              <TableHead className="text-right w-[20%]">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No items to scale
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const itemChange = ((item.new_quantity / item.original_quantity - 1) * 100)
                const changeDisplay = itemChange > 0 ? `+${itemChange.toFixed(1)}%` : `${itemChange.toFixed(1)}%`

                return (
                  <TableRow
                    key={item.id}
                    className={cn(item.rounded && 'bg-yellow-50')}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{item.component_code}</p>
                          <p className="text-sm text-muted-foreground">{item.component_name}</p>
                        </div>
                        {item.rounded && (
                          <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-400">
                            Rounded
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.original_quantity.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6,
                      })} {item.uom}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-mono',
                      item.rounded && 'text-yellow-700'
                    )}>
                      {item.new_quantity.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6,
                      })} {item.uom}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right text-sm',
                      itemChange > 0 && 'text-green-600',
                      itemChange < 0 && 'text-red-600'
                    )}>
                      {changeDisplay}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Footer */}
      <div className="text-sm text-muted-foreground text-center">
        {items.length} component{items.length !== 1 ? 's' : ''} |
        {' '}{percentChange}% {isIncrease ? 'increase' : isDecrease ? 'decrease' : 'no change'}
      </div>
    </div>
  )
}

// ========================================
// ScalePreviewLoading Component
// ========================================

export function ScalePreviewLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 bg-gray-100 rounded-lg" />
      <div className="border rounded-lg">
        <div className="h-12 bg-gray-50" />
        <div className="space-y-2 p-4">
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  )
}

export default ScalePreviewTable
