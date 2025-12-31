/**
 * WO BOM Preview Panel Component
 * Story 03.10: Work Order CRUD - BOM Auto-Selection
 * Shows selected BOM details per PLAN-014
 */

'use client'

import { Info, AlertTriangle, Package, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { BomPreview } from '@/lib/types/work-order'

interface WOBomPreviewProps {
  bom: BomPreview | null | undefined
  isLoading?: boolean
  error?: string | null
  onChangeBom?: () => void
  quantity?: number
  className?: string
}

export function WOBomPreview({
  bom,
  isLoading = false,
  error = null,
  onChangeBom,
  quantity = 1,
  className,
}: WOBomPreviewProps) {
  // Calculate scaling factor
  const scaleFactor = bom && bom.output_qty > 0 ? quantity / bom.output_qty : 1

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-800">BOM Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No BOM selected state
  if (!bom) {
    return (
      <Card className={cn('border-dashed border-amber-300 bg-amber-50', className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800">No Active BOM Found</p>
              <p className="text-sm text-amber-600">
                No active BOM is available for this product on the scheduled date.
                Please select a product with an active BOM or choose a different date.
              </p>
              {onChangeBom && (
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 h-auto text-amber-700"
                  onClick={onChangeBom}
                >
                  Select BOM Manually
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // BOM Preview
  return (
    <Card className={cn('border-blue-200 bg-blue-50/50', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" />
            <span>BOM Preview</span>
            {bom.is_recommended && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Recommended
              </Badge>
            )}
          </CardTitle>
          {onChangeBom && (
            <Button variant="link" size="sm" className="h-auto px-0" onClick={onChangeBom}>
              Change BOM
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* BOM Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-xs text-gray-500">BOM Code</p>
            <p className="font-medium text-sm">{bom.bom_code}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-xs text-gray-500">Version</p>
            <p className="font-medium text-sm">v{bom.bom_version}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-xs text-gray-500">Output Qty</p>
            <p className="font-medium text-sm">
              {bom.output_qty} {bom.output_uom}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-xs text-gray-500">Materials</p>
            <p className="font-medium text-sm">{bom.item_count} items</p>
          </div>
        </div>

        {/* Effective Dates */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <CalendarDays className="h-4 w-4" />
            <span>Effective:</span>
          </div>
          <span className="font-medium">
            {new Date(bom.effective_from).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="text-gray-400">-</span>
          <span className="font-medium">
            {bom.effective_to
              ? new Date(bom.effective_to).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'No end date'}
          </span>
        </div>

        {/* Routing Info */}
        {bom.routing_name && (
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Routing:</span>
            <span className="font-medium">{bom.routing_name}</span>
          </div>
        )}

        {/* Scaling Info */}
        {scaleFactor !== 1 && (
          <div className="flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-2 border">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Scaling:</span>
            <span className="font-medium">{scaleFactor.toFixed(2)}x</span>
            <span className="text-gray-400">
              (BOM output: {bom.output_qty} {bom.output_uom}, Order qty: {quantity})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WOBomPreview
