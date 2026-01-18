/**
 * Reject Adjustment Dialog Component
 * Wireframe: WH-INV-001 - Adjustments Tab (Screen 6)
 * PRD: FR-024 (Stock Adjustment)
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, ArrowRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Adjustment } from '@/lib/types/adjustment'
import { ADJUSTMENT_REASON_CONFIG } from '@/lib/types/adjustment'

interface RejectAdjustmentDialogProps {
  open: boolean
  adjustment: Adjustment | null
  isRejecting?: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}

const MIN_REASON_LENGTH = 10

export function RejectAdjustmentDialog({
  open,
  adjustment,
  isRejecting,
  onConfirm,
  onCancel,
}: RejectAdjustmentDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [touched, setTouched] = useState(false)

  const isValid = rejectionReason.trim().length >= MIN_REASON_LENGTH
  const showError = touched && !isValid

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(rejectionReason.trim())
      setRejectionReason('')
      setTouched(false)
    } else {
      setTouched(true)
    }
  }

  const handleCancel = () => {
    setRejectionReason('')
    setTouched(false)
    onCancel()
  }

  if (!adjustment) return null

  const reasonConfig = ADJUSTMENT_REASON_CONFIG[adjustment.reason_code]
  const isIncrease = adjustment.variance_qty > 0

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <X className="h-5 w-5" />
            Reject Adjustment
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this adjustment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* LP Information */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">License Plate</div>
            <div className="font-semibold">{adjustment.lp_number}</div>
          </div>

          {/* Product */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Product</div>
            <div className="font-semibold">{adjustment.product_name}</div>
          </div>

          {/* Quantity Change */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Quantity Change</div>
            <div className="flex items-center gap-2 text-sm">
              <span>{adjustment.original_qty.toLocaleString()} {adjustment.uom}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span>{adjustment.new_qty.toLocaleString()} {adjustment.uom}</span>
              <span
                className={cn(
                  'font-medium',
                  isIncrease ? 'text-green-600' : 'text-red-600'
                )}
              >
                ({isIncrease ? '+' : ''}{adjustment.variance_qty.toLocaleString()} {adjustment.uom})
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Reason</div>
            <Badge
              variant="outline"
              className={cn(reasonConfig.className)}
            >
              {reasonConfig.label}
            </Badge>
          </div>

          {/* Rejection Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="rejection-reason" className="flex items-center gap-1">
              Rejection Reason
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this adjustment is rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              onBlur={() => setTouched(true)}
              className={cn(
                'min-h-[100px]',
                showError && 'border-red-500 focus-visible:ring-red-500'
              )}
              aria-invalid={showError}
              aria-describedby={showError ? 'rejection-error' : undefined}
            />
            {showError && (
              <p id="rejection-error" className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Rejection reason must be at least {MIN_REASON_LENGTH} characters
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {rejectionReason.length}/{MIN_REASON_LENGTH} characters minimum
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isRejecting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isRejecting || !isValid}
          >
            {isRejecting ? (
              <>
                <span className="animate-spin mr-2">...</span>
                Rejecting...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Confirm Reject
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
