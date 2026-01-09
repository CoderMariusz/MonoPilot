'use client'

/**
 * WizardStep5WorkOrder Component
 * Story: 01.14 - Wizard Steps Complete
 *
 * Step 5: Create demo work order (optional)
 * - Disabled if no product created in step 4
 * - Pre-filled with product from step 4
 * - Quantity input (default 100)
 * - Due date picker (default tomorrow)
 */

import { useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Info,
  AlertTriangle,
  ClipboardList,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import type { Step5Response } from '@/lib/services/wizard-service'

/**
 * Work order form schema
 */
const workOrderFormSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
  due_date: z.string().min(1, 'Due date is required'),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']),
})

type WorkOrderFormData = z.infer<typeof workOrderFormSchema>

interface WizardStep5WorkOrderProps {
  onNext: (data: Step5Response) => void
  onBack: () => void
  productId?: string
  productName?: string
  productSku?: string
}

/**
 * Priority options with tooltips
 */
const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low', tooltip: 'Can be done when convenient' },
  { value: 'Normal', label: 'Normal', tooltip: 'Standard processing time' },
  { value: 'High', label: 'High', tooltip: 'Should be prioritized' },
  { value: 'Urgent', label: 'Urgent', tooltip: 'Needs immediate attention' },
] as const

export function WizardStep5WorkOrder({
  onNext,
  onBack,
  productId,
  productName,
  productSku,
}: WizardStep5WorkOrderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate tomorrow's date as default
  const tomorrowDate = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }, [])

  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: {
      quantity: 100,
      due_date: tomorrowDate,
      priority: 'Normal',
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form

  const priority = watch('priority')

  // Check if product exists (step 4 was not skipped)
  const hasProduct = !!productId

  const onSubmit = useCallback(
    async (data: WorkOrderFormData) => {
      if (!productId) {
        setError('Product is required to create a work order')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/v1/settings/onboarding/step/5', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            quantity: data.quantity,
            due_date: data.due_date,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create work order')
        }

        onNext(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create work order')
      } finally {
        setIsLoading(false)
      }
    },
    [productId, onNext]
  )

  const handleSkip = useCallback(async () => {
    setIsSkipping(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/settings/onboarding/step/5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: true }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to skip work order creation')
      }

      onNext(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip work order creation')
    } finally {
      setIsSkipping(false)
    }
  }, [onNext])

  // Loading state
  if (isLoading && !error) {
    return (
      <div className="space-y-6" role="status" aria-label="Creating work order">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Icon and intro */}
        <div className="flex items-center gap-4 pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
            <ClipboardList className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium">Create a Demo Work Order</h3>
            <p className="text-sm text-muted-foreground">
              See how production planning works with a sample work order.
            </p>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* No product warning */}
        {!hasProduct ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You skipped product creation in the previous step. Create a product first
                to demo work orders, or skip this step.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border border-dashed p-6 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Work orders require a product to produce.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                You can create work orders later in the Planning module.
              </p>
            </div>
          </div>
        ) : (
          /* Work order form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Product display (read-only) */}
            <div className="rounded-lg bg-muted/50 p-4">
              <Label className="text-xs text-muted-foreground">Product</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{productSku}</Badge>
                <span className="font-medium">{productName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Quantity */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="wo-quantity">Quantity to Produce</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many units to produce in this work order</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="wo-quantity"
                  type="number"
                  {...register('quantity', { valueAsNumber: true })}
                  className={errors.quantity ? 'border-red-500' : ''}
                  min={1}
                />
                {errors.quantity && (
                  <p className="text-xs text-red-500">{errors.quantity.message}</p>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="wo-due-date">Due Date</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>When production should be completed</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="wo-due-date"
                    type="date"
                    {...register('due_date')}
                    className={errors.due_date ? 'border-red-500' : ''}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                {errors.due_date && (
                  <p className="text-xs text-red-500">{errors.due_date.message}</p>
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="wo-priority">Priority</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How urgently this work order should be processed</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={priority}
                onValueChange={(v) =>
                  setValue('priority', v as WorkOrderFormData['priority'])
                }
              >
                <SelectTrigger id="wo-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <Tooltip key={opt.value}>
                      <TooltipTrigger asChild>
                        <SelectItem value={opt.value}>{opt.label}</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{opt.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {PRIORITY_OPTIONS.find((p) => p.value === priority)?.tooltip}
              </p>
            </div>

            {/* Info about draft status */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              <p className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Work orders start as <Badge variant="secondary">Draft</Badge> until
                scheduled for production.
              </p>
            </div>

            {/* Submit button */}
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Demo Work Order
              </Button>
            </div>
          </form>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading || isSkipping}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isLoading || isSkipping}
              className="text-muted-foreground"
            >
              {isSkipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {hasProduct ? "Skip - I'll Create Work Orders Later" : 'Skip to Finish'}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
