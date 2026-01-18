/**
 * Approve Adjustment Dialog Component
 * Wireframe: WH-INV-001 - Adjustments Tab (Screen 6)
 * PRD: FR-024 (Stock Adjustment)
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Adjustment } from '@/lib/types/adjustment'
import { ADJUSTMENT_REASON_CONFIG } from '@/lib/types/adjustment'

interface ApproveAdjustmentDialogProps {
  open: boolean
  adjustment: Adjustment | null
  isApproving?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ApproveAdjustmentDialog({
  open,
  adjustment,
  isApproving,
  onConfirm,
  onCancel,
}: ApproveAdjustmentDialogProps) {
  if (!adjustment) return null

  const reasonConfig = ADJUSTMENT_REASON_CONFIG[adjustment.reason_code]
  const isIncrease = adjustment.variance_qty > 0

  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Approve Adjustment
          </DialogTitle>
          <DialogDescription>
            Review the adjustment details before approving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* LP Information */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">License Plate</div>
            <div className="font-semibold">{adjustment.lp_number}</div>
            {adjustment.batch_number && (
              <div className="text-sm text-muted-foreground">
                Batch: {adjustment.batch_number}
              </div>
            )}
          </div>

          {/* Product */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Product</div>
            <div className="font-semibold">{adjustment.product_name}</div>
            <div className="text-sm text-muted-foreground">{adjustment.product_code}</div>
          </div>

          {/* Quantity Change */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Quantity Change</div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">
                {adjustment.original_qty.toLocaleString()} {adjustment.uom}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-lg font-semibold">
                {adjustment.new_qty.toLocaleString()} {adjustment.uom}
              </div>
            </div>
          </div>

          {/* Variance */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Variance</div>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'text-lg font-bold',
                  isIncrease ? 'text-green-600' : 'text-red-600'
                )}
              >
                {isIncrease ? '+' : ''}
                {adjustment.variance_qty.toLocaleString()} {adjustment.uom}
              </div>
              <div
                className={cn(
                  'text-sm',
                  adjustment.variance_value >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {adjustment.variance_value >= 0 ? '+' : ''}
                {formatValue(adjustment.variance_value)}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Reason</div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(reasonConfig.className)}
              >
                {reasonConfig.label}
              </Badge>
            </div>
            {adjustment.reason_notes && (
              <div className="text-sm text-muted-foreground mt-1">
                {adjustment.reason_notes}
              </div>
            )}
          </div>

          {/* Adjusted By */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Adjusted By</div>
            <div className="text-sm">{adjustment.adjusted_by_name}</div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isApproving}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isApproving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isApproving ? (
              <>
                <span className="animate-spin mr-2">...</span>
                Approving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm Approve
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
