/**
 * Hold Order Dialog Component
 * Story 07.3: SO Status Workflow
 *
 * Modal dialog for placing sales order on hold
 * - Validates current status allows hold (draft or confirmed)
 * - Optional reason input (max 500 chars)
 * - Loading state while submitting
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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PauseCircle, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useHoldOrder } from '@/lib/hooks/use-sales-orders'
import type { SOStatus } from '@/lib/services/sales-order-service'
import { holdOrderSchema, type HoldOrderInput } from '@/lib/validation/so-status-schemas'

// =============================================================================
// Types
// =============================================================================

interface HoldOrderDialogProps {
  orderId: string
  orderNumber: string
  currentStatus: SOStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Statuses that allow hold action
const HOLDABLE_STATUSES: SOStatus[] = ['draft', 'confirmed']

// =============================================================================
// Component
// =============================================================================

export function HoldOrderDialog({
  orderId,
  orderNumber,
  currentStatus,
  open,
  onOpenChange,
  onSuccess,
}: HoldOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const holdMutation = useHoldOrder()

  // Check if hold is allowed
  const canHold = HOLDABLE_STATUSES.includes(currentStatus)

  // Form setup
  const form = useForm<HoldOrderInput>({
    resolver: zodResolver(holdOrderSchema),
    defaultValues: {
      reason: '',
    },
  })

  // Handle form submission
  const handleSubmit = async (data: HoldOrderInput) => {
    if (!canHold) {
      toast.error('Cannot hold this order', {
        description: 'The current status does not allow holding.',
      })
      return
    }

    try {
      setIsSubmitting(true)
      await holdMutation.mutateAsync({
        id: orderId,
        data: data.reason ? { reason: data.reason } : undefined,
      })

      toast.success('Order placed on hold', {
        description: `${orderNumber} has been placed on hold.`,
      })

      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to hold order'
      toast.error('Failed to hold order', {
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="hold-order-dialog"
        aria-describedby="hold-order-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PauseCircle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
            Hold Order
          </DialogTitle>
          <DialogDescription id="hold-order-description">
            Place order {orderNumber} on hold. You can provide an optional reason.
          </DialogDescription>
        </DialogHeader>

        {!canHold ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              Cannot hold this order. Orders can only be placed on hold when in
              &quot;Draft&quot; or &quot;Confirmed&quot; status. Current status:{' '}
              <strong className="capitalize">{currentStatus.replace('_', ' ')}</strong>
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
                      Reason <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter reason for placing order on hold..."
                        maxLength={500}
                        rows={3}
                        {...field}
                        aria-describedby="reason-helper"
                      />
                    </FormControl>
                    <p id="reason-helper" className="text-xs text-muted-foreground">
                      {field.value?.length || 0}/500 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  disabled={isSubmitting}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      Holding...
                    </>
                  ) : (
                    <>
                      <PauseCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                      Hold Order
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default HoldOrderDialog
