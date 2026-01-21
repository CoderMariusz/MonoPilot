'use client'

/**
 * ZeroQtyWarningModal Component (Story 04.7c)
 *
 * Warning dialog when by-product quantity is 0:
 * - Shows warning message
 * - Confirm Anyway - register with 0 qty
 * - Skip By-Product - skip without registering
 * - Cancel - return to form
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export interface ZeroQtyWarningModalProps {
  /** Whether modal is open */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Product name to display */
  productName: string
  /** Callback to confirm with 0 qty */
  onConfirmAnyway: () => void
  /** Callback to skip this by-product */
  onSkip: () => void
  /** Callback to cancel and return to form */
  onCancel: () => void
}

export function ZeroQtyWarningModal({
  open,
  onOpenChange,
  productName,
  onConfirmAnyway,
  onSkip,
  onCancel,
}: ZeroQtyWarningModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Zero Quantity Warning
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                By-product quantity is 0. You are about to register <span className="font-medium">{productName}</span> with a quantity of 0.
              </p>
              <p>
                This will create a record but no License Plate will be generated.
              </p>
              <p className="font-medium">Continue?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onSkip}
            className="w-full sm:w-auto"
          >
            Skip By-Product
          </Button>
          <Button
            variant="default"
            onClick={onConfirmAnyway}
            className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600"
          >
            Confirm Anyway
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ZeroQtyWarningModal
