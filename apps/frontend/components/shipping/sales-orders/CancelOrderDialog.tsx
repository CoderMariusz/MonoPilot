/**
 * Cancel Order Dialog Component
 * Story 07.3: SO Status Workflow
 *
 * Modal dialog for cancelling sales order with required reason
 * - Validates current status allows cancel (draft, confirmed, on_hold, allocated)
 * - Required reason input (min 10, max 500 chars)
 * - Form validation with real-time feedback
 * - Loading state while submitting
 * - Confirmation: "Are you sure? This action cannot be undone."
 * - Success/error toast feedback
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useCancelOrder } from '@/lib/hooks/use-sales-orders'
import type { SOStatus } from '@/lib/services/sales-order-service'
import { cancelOrderSchema, type CancelOrderInput } from '@/lib/validation/so-status-schemas'

// =============================================================================
// Types
// =============================================================================

interface CancelOrderDialogProps {
  orderId: string
  orderNumber: string
  currentStatus: SOStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Statuses that allow cancel action
const CANCELLABLE_STATUSES: SOStatus[] = ['draft', 'confirmed', 'on_hold', 'allocated']

// =============================================================================
// Component
// =============================================================================

export function CancelOrderDialog({
  orderId,
  orderNumber,
  currentStatus,
  open,
  onOpenChange,
  onSuccess,
}: CancelOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const cancelMutation = useCancelOrder()

  // Check if cancel is allowed
  const canCancel = CANCELLABLE_STATUSES.includes(currentStatus)

  // Form setup
  const form = useForm<CancelOrderInput>({
    resolver: zodResolver(cancelOrderSchema),
    defaultValues: {
      reason: '',
    },
    mode: 'onChange', // Real-time validation
  })

  const watchReason = form.watch('reason')
  const reasonLength = watchReason?.length || 0
  const isReasonValid = reasonLength >= 10

  // Handle form submission - show confirmation first
  const handleSubmit = async (data: CancelOrderInput) => {
    if (!canCancel) {
      toast.error('Cannot cancel this order', {
        description: 'The current status does not allow cancellation.',
      })
      return
    }

    // Show confirmation dialog
    setShowConfirmation(true)
  }

  // Handle confirmed cancellation
  const handleConfirmedCancel = async () => {
    const reason = form.getValues('reason')

    try {
      setIsSubmitting(true)
      setShowConfirmation(false)

      await cancelMutation.mutateAsync({
        id: orderId,
        data: { reason },
      })

      toast.success('Order cancelled', {
        description: `${orderNumber} has been cancelled.`,
      })

      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel order'
      toast.error('Failed to cancel order', {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle dialog close
  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-md"
          data-testid="cancel-order-dialog"
          aria-describedby="cancel-order-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
              Cancel Order
            </DialogTitle>
            <DialogDescription id="cancel-order-description">
              Cancel order {orderNumber}. A reason is required for cancellation.
            </DialogDescription>
          </DialogHeader>

          {!canCancel ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Cannot cancel this order. Orders can only be cancelled when in
                &quot;Draft&quot;, &quot;Confirmed&quot;, &quot;On Hold&quot;, or
                &quot;Allocated&quot; status. Current status:{' '}
                <strong className="capitalize">{currentStatus.replace('_', ' ')}</strong>
                <br />
                <span className="text-sm mt-1 block">
                  Please contact warehouse manager for orders in picking or later stages.
                </span>
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Reason <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter reason for cancellation (minimum 10 characters)..."
                          maxLength={500}
                          rows={4}
                          {...field}
                          aria-describedby="reason-helper reason-error"
                          aria-invalid={!!form.formState.errors.reason}
                          className={
                            form.formState.errors.reason
                              ? 'border-red-500 focus:ring-red-500'
                              : ''
                          }
                        />
                      </FormControl>
                      <div className="flex justify-between items-center">
                        <p
                          id="reason-helper"
                          className={`text-xs ${
                            reasonLength < 10 ? 'text-amber-600' : 'text-muted-foreground'
                          }`}
                        >
                          {reasonLength}/500 characters (minimum 10 required)
                        </p>
                        {reasonLength > 0 && reasonLength < 10 && (
                          <p className="text-xs text-amber-600">
                            {10 - reasonLength} more characters needed
                          </p>
                        )}
                      </div>
                      <FormMessage id="reason-error" />
                    </FormItem>
                  )}
                />

                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  <AlertDescription className="text-amber-800">
                    <strong>Warning:</strong> Cancelling an order cannot be undone.
                    All allocations will be released.
                  </AlertDescription>
                </Alert>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={isSubmitting || !isReasonValid}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                        Cancel Order
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
              Confirm Cancellation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order <strong>{orderNumber}</strong>?
              <br />
              <br />
              <strong>This action cannot be undone.</strong> Any allocated inventory
              will be released back to available stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedCancel}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default CancelOrderDialog
