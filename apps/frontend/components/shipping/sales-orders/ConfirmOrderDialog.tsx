/**
 * Confirm Order Dialog Component
 * Story 07.3: SO Status Workflow
 *
 * Modal dialog for confirming sales order or releasing from hold
 * - Validates current status allows confirm (draft or on_hold)
 * - Simple confirmation action
 * - Loading state while submitting
 * - Success/error toast feedback
 */

'use client'

import { useState } from 'react'
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
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirmSalesOrder } from '@/lib/hooks/use-sales-orders'
import type { SOStatus } from '@/lib/services/sales-order-service'

// =============================================================================
// Types
// =============================================================================

interface ConfirmOrderDialogProps {
  orderId: string
  orderNumber: string
  currentStatus: SOStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Statuses that allow confirm action
const CONFIRMABLE_STATUSES: SOStatus[] = ['draft', 'on_hold']

// =============================================================================
// Component
// =============================================================================

export function ConfirmOrderDialog({
  orderId,
  orderNumber,
  currentStatus,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const confirmMutation = useConfirmSalesOrder()

  // Check if confirm is allowed
  const canConfirm = CONFIRMABLE_STATUSES.includes(currentStatus)
  const isReleaseFromHold = currentStatus === 'on_hold'

  // Get action text based on current status
  const actionText = isReleaseFromHold ? 'Release from Hold' : 'Confirm Order'
  const successMessage = isReleaseFromHold
    ? 'Order released from hold'
    : 'Order confirmed'

  // Handle confirmed action
  const handleConfirm = async () => {
    if (!canConfirm) {
      toast.error('Cannot confirm this order', {
        description: 'The current status does not allow confirmation.',
      })
      return
    }

    try {
      setIsSubmitting(true)
      await confirmMutation.mutateAsync(orderId)

      toast.success(successMessage, {
        description: `${orderNumber} has been ${
          isReleaseFromHold ? 'released from hold' : 'confirmed'
        }.`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm order'
      toast.error('Failed to confirm order', {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="confirm-order-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle
              className={`h-5 w-5 ${isReleaseFromHold ? 'text-blue-600' : 'text-green-600'}`}
              aria-hidden="true"
            />
            {actionText}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {!canConfirm ? (
              <span className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Cannot confirm this order. Current status:{' '}
                <strong className="capitalize">{currentStatus.replace('_', ' ')}</strong>
              </span>
            ) : isReleaseFromHold ? (
              <>
                Are you sure you want to release order <strong>{orderNumber}</strong>{' '}
                from hold?
                <br />
                <br />
                The order will be set back to &quot;Confirmed&quot; status and can
                proceed to allocation and fulfillment.
              </>
            ) : (
              <>
                Are you sure you want to confirm order <strong>{orderNumber}</strong>?
                <br />
                <br />
                Once confirmed, the order will be ready for allocation and fulfillment.
                Line items cannot be modified after confirmation.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSubmitting || !canConfirm}
            className={
              isReleaseFromHold
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-600'
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                {isReleaseFromHold ? 'Releasing...' : 'Confirming...'}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                {actionText}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmOrderDialog
