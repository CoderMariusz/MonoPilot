'use client'

/**
 * YieldEntryForm Component
 * Story: 04.4 - Yield Tracking
 *
 * Manual yield entry form with validation.
 * Allows operators to update produced quantity with optional notes.
 *
 * AC-2: Manual Yield Entry
 * - Validates non-negative produced_quantity
 * - Validates numeric input
 * - Checks overproduction if configured
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2, Lock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface YieldUpdateResult {
  wo_id: string
  produced_quantity: number
  yield_percent: number
  yield_color: string
  yield_label: string
  updated_at: string
}

export interface YieldEntryFormProps {
  /** Work Order ID */
  woId: string
  /** Current produced quantity */
  currentProducedQuantity: number
  /** Planned quantity for validation */
  plannedQuantity: number
  /** Unit of measure */
  uom?: string
  /** Whether overproduction is allowed */
  allowOverproduction?: boolean
  /** Whether form is disabled (WO not in progress) */
  disabled?: boolean
  /** Loading state */
  isLoading?: boolean
  /** Callback on successful update */
  onSuccess: (result: YieldUpdateResult) => void
  /** Optional callback on error */
  onError?: (error: Error) => void
}

/**
 * Create Zod schema with dynamic max validation
 */
function createYieldSchema(plannedQuantity: number, allowOverproduction: boolean) {
  const baseSchema = z.object({
    produced_quantity: z
      .number({
        required_error: 'Produced quantity is required',
        invalid_type_error: 'Must be a valid number',
      })
      .nonnegative({ message: 'Produced quantity must be positive' })
      .finite({ message: 'Must be a valid number' }),
    notes: z.string().max(1000, { message: 'Notes cannot exceed 1000 characters' }).optional(),
  })

  if (!allowOverproduction) {
    return baseSchema.refine(
      (data) => data.produced_quantity <= plannedQuantity,
      {
        message: `Produced quantity cannot exceed planned quantity (${plannedQuantity.toLocaleString()})`,
        path: ['produced_quantity'],
      }
    )
  }

  return baseSchema
}

type YieldFormValues = z.infer<ReturnType<typeof createYieldSchema>>

/**
 * Loading skeleton for YieldEntryForm
 */
export function YieldEntryFormSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Update Produced Quantity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  )
}

/**
 * Disabled state message when WO is not started
 */
function DisabledMessage({ onStartWO }: { onStartWO?: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <Lock className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="font-medium text-lg mb-1">Start WO to enter yield</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Yield entry is available when the work order is in progress.
        </p>
        {onStartWO && (
          <Button variant="outline" onClick={onStartWO}>
            Start Work Order
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function YieldEntryForm({
  woId,
  currentProducedQuantity,
  plannedQuantity,
  uom = 'units',
  allowOverproduction = true,
  disabled = false,
  isLoading = false,
  onSuccess,
  onError,
}: YieldEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const yieldSchema = createYieldSchema(plannedQuantity, allowOverproduction)

  const form = useForm<YieldFormValues>({
    resolver: zodResolver(yieldSchema),
    defaultValues: {
      produced_quantity: currentProducedQuantity,
      notes: '',
    },
  })

  if (isLoading) {
    return <YieldEntryFormSkeleton />
  }

  if (disabled) {
    return <DisabledMessage />
  }

  async function onSubmit(data: YieldFormValues) {
    setIsSubmitting(true)
    setShowSuccess(false)

    try {
      const response = await fetch(`/api/production/work-orders/${woId}/yield`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produced_quantity: data.produced_quantity,
          notes: data.notes || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to update yield')
      }

      const { data: result } = await response.json()

      // Show success state
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)

      // Toast notification
      toast({
        title: 'Yield updated',
        description: `New yield: ${result.yield_percent?.toFixed(1) || data.produced_quantity}%`,
      })

      // Clear notes after successful update
      form.setValue('notes', '')

      onSuccess(result)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update yield')
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
      onError?.(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Update Produced Quantity</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="produced_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Produced Quantity <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={allowOverproduction ? undefined : plannedQuantity}
                        placeholder="0"
                        disabled={isSubmitting}
                        className={cn(
                          'w-40',
                          form.formState.errors.produced_quantity && 'border-destructive'
                        )}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === '' ? 0 : parseFloat(value))
                        }}
                        aria-describedby="produced-qty-description"
                      />
                    </FormControl>
                    <span className="text-sm text-muted-foreground">{uom}</span>
                  </div>
                  <p id="produced-qty-description" className="text-xs text-muted-foreground">
                    Planned: {plannedQuantity.toLocaleString()} {uom}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any notes about this yield update..."
                      className="resize-none"
                      rows={3}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className={cn(
                'min-w-32',
                showSuccess && 'bg-green-600 hover:bg-green-700'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Updated
                </>
              ) : (
                'Update Yield'
              )}
            </Button>
          </form>
        </Form>

        {/* Screen reader announcement */}
        {showSuccess && (
          <span className="sr-only" role="status" aria-live="polite">
            Yield updated successfully. New yield: {form.getValues('produced_quantity')} {uom}.
          </span>
        )}
      </CardContent>
    </Card>
  )
}

export default YieldEntryForm
