/**
 * YieldConfigModal Component (Story 02.14)
 * Modal to configure BOM yield settings
 * FR-2.34: Yield configuration
 *
 * Features:
 * - Expected yield input (0-100%)
 * - Variance threshold input
 * - Form validation
 * - Save/Cancel actions
 * - Keyboard accessible
 */

'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Info, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUpdateBOMYield } from '@/lib/hooks/use-bom-yield'
import { useToast } from '@/hooks/use-toast'
import type { BomYieldResponse } from '@/lib/types/bom-advanced'

// ========================================
// Form Schema
// ========================================

const yieldConfigSchema = z.object({
  expected_yield_percent: z
    .number({ invalid_type_error: 'Please enter a valid number' })
    .min(0, 'Yield must be at least 0%')
    .max(100, 'Yield cannot exceed 100%'),
  variance_threshold_percent: z
    .number({ invalid_type_error: 'Please enter a valid number' })
    .min(0, 'Threshold must be at least 0%')
    .max(50, 'Threshold cannot exceed 50%'),
})

type YieldConfigFormValues = z.infer<typeof yieldConfigSchema>

// ========================================
// Props Interface
// ========================================

export interface YieldConfigModalProps {
  /** BOM ID to configure yield for */
  bomId: string
  /** Current expected yield (null if not set) */
  currentYield: number | null
  /** Whether modal is open */
  isOpen: boolean
  /** Callback when modal closes */
  onClose: () => void
  /** Callback when yield is saved */
  onSave: (yieldData: BomYieldResponse) => void
}

// ========================================
// YieldConfigModal Component
// ========================================

export function YieldConfigModal({
  bomId,
  currentYield,
  isOpen,
  onClose,
  onSave,
}: YieldConfigModalProps) {
  const { toast } = useToast()
  const updateYield = useUpdateBOMYield()

  // Form setup
  const form = useForm<YieldConfigFormValues>({
    resolver: zodResolver(yieldConfigSchema),
    defaultValues: {
      expected_yield_percent: currentYield ?? 95,
      variance_threshold_percent: 5,
    },
  })

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        expected_yield_percent: currentYield ?? 95,
        variance_threshold_percent: 5,
      })
    }
  }, [isOpen, currentYield, form])

  // Handle form submission
  const onSubmit = async (data: YieldConfigFormValues) => {
    try {
      const result = await updateYield.mutateAsync({
        bomId,
        request: {
          expected_yield_percent: data.expected_yield_percent,
          variance_threshold_percent: data.variance_threshold_percent,
        },
      })

      toast({
        title: 'Yield Configuration Saved',
        description: `Expected yield set to ${data.expected_yield_percent}%`,
      })

      onSave(result)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save yield configuration',
        variant: 'destructive',
      })
    }
  }

  // Handle close
  const handleClose = () => {
    if (!updateYield.isPending) {
      form.reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Yield Settings</DialogTitle>
          <DialogDescription>
            Set the expected yield percentage for this BOM. A warning will be shown
            when actual yield deviates beyond the threshold.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Expected yield is used to estimate output quantities and detect
                production variances.
              </AlertDescription>
            </Alert>

            {/* Expected Yield Field */}
            <FormField
              control={form.control}
              name="expected_yield_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Yield *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="95.0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : 0)
                        }
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Expected output percentage (0-100%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variance Threshold Field */}
            <FormField
              control={form.control}
              name="variance_threshold_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variance Threshold</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        placeholder="5.0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : 5)
                        }
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Warning shown when actual yield differs by more than this amount
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Alert */}
            {updateYield.isError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {updateYield.error?.message || 'Failed to save configuration'}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateYield.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateYield.isPending}>
                {updateYield.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default YieldConfigModal
