/**
 * BOMScaleModal Component (Story 02.14)
 * Batch size scaling tool with preview
 * FR-2.35: BOM Scaling
 *
 * Features:
 * - Input for new batch size OR multiplier
 * - Real-time preview of scaled quantities
 * - Rounding warning indicators
 * - Preview vs Apply toggle
 * - All 4 UI states (loading, error, empty, success)
 * - Keyboard accessible
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  AlertTriangle,
  Scale,
  RefreshCw,
  Calculator,
} from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScalePreviewTable, ScalePreviewLoading } from './ScalePreviewTable'
import { useBOMScale, previewBOMScale, calculateScaleFactor } from '@/lib/hooks/use-bom-scale'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ScaleBomResponse } from '@/lib/types/bom-advanced'

// ========================================
// Form Schema
// ========================================

const scaleFormSchema = z.object({
  target_batch_size: z
    .number({ invalid_type_error: 'Please enter a valid number' })
    .positive('Batch size must be positive')
    .optional()
    .nullable(),
  scale_factor: z
    .number({ invalid_type_error: 'Please enter a valid number' })
    .positive('Scale factor must be positive')
    .optional()
    .nullable(),
  round_decimals: z
    .number()
    .int()
    .min(0)
    .max(6),
  preview_only: z.boolean(),
})

type ScaleFormValues = z.infer<typeof scaleFormSchema>

// ========================================
// Props Interface
// ========================================

export interface BOMScaleModalProps {
  /** BOM ID to scale */
  bomId: string
  /** Current batch size */
  currentBatchSize: number
  /** Current unit of measure */
  currentUom: string
  /** Whether modal is open */
  isOpen: boolean
  /** Callback when modal closes */
  onClose: () => void
  /** Callback when scaling is applied */
  onApply: (result: ScaleBomResponse) => void
}

// ========================================
// BOMScaleModal Component
// ========================================

export function BOMScaleModal({
  bomId,
  currentBatchSize,
  currentUom,
  isOpen,
  onClose,
  onApply,
}: BOMScaleModalProps) {
  const { toast } = useToast()
  const scaleMutation = useBOMScale()

  // Local state
  const [inputMode, setInputMode] = useState<'target' | 'factor'>('target')
  const [preview, setPreview] = useState<ScaleBomResponse | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Form setup
  const form = useForm<ScaleFormValues>({
    resolver: zodResolver(scaleFormSchema),
    defaultValues: {
      target_batch_size: currentBatchSize * 1.5, // Default to 1.5x
      scale_factor: 1.5,
      round_decimals: 3,
      preview_only: true,
    },
  })

  // Watch form values for preview
  const watchTargetBatch = form.watch('target_batch_size')
  const watchScaleFactor = form.watch('scale_factor')
  const watchRoundDecimals = form.watch('round_decimals')
  const watchPreviewOnly = form.watch('preview_only')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        target_batch_size: currentBatchSize * 1.5,
        scale_factor: 1.5,
        round_decimals: 3,
        preview_only: true,
      })
      setPreview(null)
      setPreviewError(null)
    }
  }, [isOpen, currentBatchSize, form])

  // Fetch preview when values change
  const fetchPreview = useCallback(async () => {
    const targetBatch = inputMode === 'target' ? (watchTargetBatch ?? undefined) : undefined
    const factor = inputMode === 'factor' ? (watchScaleFactor ?? undefined) : undefined

    if (!targetBatch && !factor) return

    setPreviewLoading(true)
    setPreviewError(null)

    try {
      const result = await previewBOMScale(
        bomId,
        targetBatch,
        factor,
        watchRoundDecimals ?? 3
      )
      setPreview(result)
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to preview scaling')
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }, [bomId, inputMode, watchTargetBatch, watchScaleFactor, watchRoundDecimals])

  // Debounced preview fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        fetchPreview()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [fetchPreview, isOpen])

  // Handle form submission
  const onSubmit = async (data: ScaleFormValues) => {
    try {
      const result = await scaleMutation.mutateAsync({
        bomId,
        request: {
          target_batch_size: inputMode === 'target' ? (data.target_batch_size ?? undefined) : undefined,
          scale_factor: inputMode === 'factor' ? (data.scale_factor ?? undefined) : undefined,
          round_decimals: data.round_decimals,
          preview_only: data.preview_only,
        },
      })

      if (!data.preview_only && result.applied) {
        toast({
          title: 'BOM Scaled Successfully',
          description: `Batch size updated from ${currentBatchSize} to ${result.new_batch_size} ${currentUom}`,
        })
        onApply(result)
      } else {
        // Just update preview
        setPreview(result)
      }
    } catch (error) {
      toast({
        title: 'Scaling Failed',
        description: error instanceof Error ? error.message : 'Failed to scale BOM',
        variant: 'destructive',
      })
    }
  }

  // Handle close
  const handleClose = () => {
    if (!scaleMutation.isPending) {
      form.reset()
      setPreview(null)
      setPreviewError(null)
      onClose()
    }
  }

  // Calculate display values
  const calculatedFactor = inputMode === 'target' && watchTargetBatch
    ? calculateScaleFactor(currentBatchSize, watchTargetBatch)
    : watchScaleFactor || 1

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Scale BOM Quantities
          </DialogTitle>
          <DialogDescription>
            Scale all ingredient quantities to a new batch size.
            Current: {currentBatchSize} {currentUom}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Input Mode Tabs */}
            <Tabs
              value={inputMode}
              onValueChange={(v) => setInputMode(v as 'target' | 'factor')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="target">
                  <Calculator className="mr-2 h-4 w-4" />
                  Target Batch Size
                </TabsTrigger>
                <TabsTrigger value="factor">
                  <Scale className="mr-2 h-4 w-4" />
                  Scale Factor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="target" className="pt-4">
                <FormField
                  control={form.control}
                  name="target_batch_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Batch Size</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.001"
                            min="0.001"
                            placeholder={currentBatchSize.toString()}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                            className="pr-16"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {currentUom}
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription className="flex items-center justify-between">
                        <span>Enter the desired batch size</span>
                        <Badge variant="outline">
                          {calculatedFactor.toFixed(3)}x
                        </Badge>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="factor" className="pt-4">
                <FormField
                  control={form.control}
                  name="scale_factor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scale Factor</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="1.5"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            x
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription className="flex items-center justify-between">
                        <span>Multiply all quantities by this factor</span>
                        <Badge variant="outline">
                          = {(currentBatchSize * (watchScaleFactor || 1)).toFixed(2)} {currentUom}
                        </Badge>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {/* Rounding Options */}
            <FormField
              control={form.control}
              name="round_decimals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decimal Precision</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max="6"
                      {...field}
                      value={field.value ?? 3}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value, 10) : 3)
                      }
                      className="w-24"
                    />
                  </FormControl>
                  <FormDescription>
                    Number of decimal places for quantities (0-6)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Preview</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchPreview}
                  disabled={previewLoading}
                >
                  <RefreshCw className={cn('mr-2 h-4 w-4', previewLoading && 'animate-spin')} />
                  Refresh
                </Button>
              </div>

              {/* Preview Loading */}
              {previewLoading && <ScalePreviewLoading />}

              {/* Preview Error */}
              {previewError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Preview Error</AlertTitle>
                  <AlertDescription>{previewError}</AlertDescription>
                </Alert>
              )}

              {/* Preview Success */}
              {preview && !previewLoading && !previewError && (
                <>
                  <ScalePreviewTable
                    items={preview.items}
                    originalBatchSize={preview.original_batch_size}
                    newBatchSize={preview.new_batch_size}
                    scaleFactor={preview.scale_factor}
                  />

                  {/* Warnings */}
                  {preview.warnings.length > 0 && (
                    <Alert className="mt-4 border-yellow-300 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Warnings</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        <ul className="list-disc list-inside">
                          {preview.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>

            {/* Preview Only Checkbox */}
            <FormField
              control={form.control}
              name="preview_only"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 bg-gray-50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Preview Only
                    </FormLabel>
                    <FormDescription>
                      {field.value
                        ? 'Changes will NOT be saved to the database'
                        : 'Changes WILL be saved when you click Apply'}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Apply Warning */}
            {!watchPreviewOnly && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Clicking &quot;Apply Scaling&quot; will permanently update all BOM item quantities.
                  This action cannot be undone.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={scaleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={scaleMutation.isPending || (!preview && watchPreviewOnly)}
                variant={watchPreviewOnly ? 'secondary' : 'default'}
              >
                {scaleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {watchPreviewOnly ? 'Refreshing...' : 'Applying...'}
                  </>
                ) : watchPreviewOnly ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Preview
                  </>
                ) : (
                  <>
                    <Scale className="mr-2 h-4 w-4" />
                    Apply Scaling
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default BOMScaleModal
