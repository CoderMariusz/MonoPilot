/**
 * Clone Order Dialog Component
 * Story 07.5: SO Clone/Import
 *
 * Confirmation dialog for cloning a sales order
 * - Shows SO number being cloned
 * - Confirmation message explaining what will be created
 * - Loading state with spinner during clone
 * - Error message display with Retry option
 * - Success: Auto-close and navigate to new order
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useCloneSalesOrder } from '@/lib/hooks/use-sales-orders'

// =============================================================================
// Types
// =============================================================================

interface CloneOrderDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** The ID of the sales order to clone */
  soId: string
  /** The order number for display */
  soNumber: string
  /** Callback when dialog is closed */
  onClose: () => void
  /** Callback when clone succeeds - receives new order ID */
  onSuccess?: (newOrderId: string) => void
  /** Whether clone is in progress (external control) */
  isLoading?: boolean
}

// =============================================================================
// Component
// =============================================================================

export function CloneOrderDialog({
  isOpen,
  soId,
  soNumber,
  onClose,
  onSuccess,
  isLoading: externalLoading,
}: CloneOrderDialogProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const cloneMutation = useCloneSalesOrder()

  const isLoading = externalLoading ?? cloneMutation.isPending

  const handleConfirm = async () => {
    try {
      setError(null)
      const result = await cloneMutation.mutateAsync(soId)

      toast.success('Order cloned successfully', {
        description: `Created ${result.salesOrder.order_number} from ${result.clonedFrom}`,
      })

      // Call onSuccess callback
      onSuccess?.(result.salesOrder.id)

      // Close dialog
      onClose()

      // Navigate to new order after brief delay
      setTimeout(() => {
        router.push(`/shipping/sales-orders/${result.salesOrder.id}`)
      }, 100)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clone order'
      setError(message)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleConfirm()
  }

  const handleClose = () => {
    if (!isLoading) {
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="clone-order-dialog"
        aria-describedby="clone-order-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" aria-hidden="true" />
            Clone Sales Order
          </DialogTitle>
          <DialogDescription id="clone-order-description">
            Create a copy of an existing order with the same customer and products.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Clone <span className="font-medium text-foreground">{soNumber}</span>?
            A new draft order will be created with the same customer and products.
          </p>

          <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
            <p className="font-medium">The new order will have:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-1">
              <li>Same customer and shipping address</li>
              <li>Same products and quantities</li>
              <li>Same unit prices</li>
              <li>Status set to &quot;Draft&quot;</li>
              <li>Today&apos;s date as order date</li>
            </ul>
          </div>

          <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
            <p className="font-medium">The new order will NOT include:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-1">
              <li>Customer PO number</li>
              <li>Promised ship date</li>
              <li>Required delivery date</li>
              <li>Any allocations or picks</li>
            </ul>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Cloning...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                Clone
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CloneOrderDialog
