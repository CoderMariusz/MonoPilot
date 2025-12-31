/**
 * WO Form Component
 * Story 03.10: Work Order CRUD - Create/Edit Form
 * Main form container with BOM auto-selection per PLAN-014
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Info } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useBomForDate, useAvailableBoms } from '@/lib/hooks/use-bom-selection'
import { useCreateWorkOrder, useUpdateWorkOrder } from '@/lib/hooks/use-work-order-mutations'
import type { WorkOrderWithRelations, WOPriority, CreateWOInput } from '@/lib/types/work-order'
import { WO_PRIORITY_CONFIG } from '@/lib/types/work-order'
import { WOBomPreview } from './WOBomPreview'
import { WOBomSelectionModal } from './WOBomSelectionModal'

// Form schema
const woFormSchema = z.object({
  product_id: z.string().uuid('Please select a product'),
  bom_id: z.string().uuid().nullable().optional(),
  planned_quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'UoM is required'),
  planned_start_date: z.string().min(1, 'Scheduled date is required'),
  planned_end_date: z.string().nullable().optional(),
  scheduled_start_time: z.string().nullable().optional(),
  scheduled_end_time: z.string().nullable().optional(),
  production_line_id: z.string().uuid().nullable().optional(),
  machine_id: z.string().uuid().nullable().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  notes: z.string().max(2000).nullable().optional(),
}).refine(
  (data) => {
    if (data.planned_end_date && data.planned_start_date) {
      return data.planned_end_date >= data.planned_start_date
    }
    return true
  },
  {
    message: 'End date must be on or after start date',
    path: ['planned_end_date'],
  }
)

type WOFormValues = z.infer<typeof woFormSchema>

interface WOFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrder?: WorkOrderWithRelations | null
  onSuccess?: () => void
}

interface Product {
  id: string
  code: string
  name: string
  base_uom: string
}

interface ProductionLine {
  id: string
  code: string
  name: string
}

export function WOForm({
  open,
  onOpenChange,
  workOrder,
  onSuccess,
}: WOFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingLines, setLoadingLines] = useState(true)
  const [bomSelectionOpen, setBomSelectionOpen] = useState(false)
  const [manualBomId, setManualBomId] = useState<string | null>(null)

  const { toast } = useToast()
  const createMutation = useCreateWorkOrder()
  const updateMutation = useUpdateWorkOrder()

  const isEditMode = !!workOrder
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Default form values
  const defaultValues: WOFormValues = {
    product_id: workOrder?.product_id || '',
    bom_id: workOrder?.bom_id || null,
    planned_quantity: workOrder?.planned_quantity || 1,
    uom: workOrder?.uom || '',
    planned_start_date: workOrder?.planned_start_date
      ? workOrder.planned_start_date.split('T')[0]
      : new Date().toISOString().split('T')[0],
    planned_end_date: workOrder?.planned_end_date
      ? workOrder.planned_end_date.split('T')[0]
      : null,
    scheduled_start_time: workOrder?.scheduled_start_time || null,
    scheduled_end_time: workOrder?.scheduled_end_time || null,
    production_line_id: workOrder?.production_line_id || null,
    machine_id: workOrder?.machine_id || null,
    priority: (workOrder?.priority as WOPriority) || 'normal',
    notes: workOrder?.notes || null,
  }

  const form = useForm<WOFormValues>({
    resolver: zodResolver(woFormSchema),
    defaultValues,
  })

  const selectedProductId = form.watch('product_id')
  const scheduledDate = form.watch('planned_start_date')
  const plannedQuantity = form.watch('planned_quantity')

  // Fetch BOM based on product and date
  const {
    data: autoBom,
    isLoading: bomLoading,
    error: bomError,
  } = useBomForDate(
    selectedProductId && !isEditMode ? selectedProductId : null,
    scheduledDate
  )

  // Fetch available BOMs for manual selection
  const { data: availableBoms = [], isLoading: availableBomsLoading } =
    useAvailableBoms(selectedProductId)

  // Selected BOM (auto or manual)
  const selectedBom = manualBomId
    ? availableBoms.find((b) => b.bom_id === manualBomId)
    : autoBom

  // Update BOM ID in form when auto-selected
  useEffect(() => {
    if (!isEditMode && autoBom && !manualBomId) {
      form.setValue('bom_id', autoBom.bom_id)
    }
  }, [autoBom, isEditMode, manualBomId, form])

  // Update UoM when product changes
  useEffect(() => {
    if (selectedProductId && !isEditMode) {
      const product = products.find((p) => p.id === selectedProductId)
      if (product) {
        form.setValue('uom', product.base_uom)
      }
    }
  }, [selectedProductId, products, isEditMode, form])

  // Reset manual BOM when product changes
  useEffect(() => {
    setManualBomId(null)
  }, [selectedProductId])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await fetch('/api/technical/products?type=FG&limit=500')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoadingProducts(false)
      }
    }

    if (open) {
      fetchProducts()
    }
  }, [open])

  // Fetch production lines
  useEffect(() => {
    const fetchLines = async () => {
      try {
        setLoadingLines(true)
        const response = await fetch('/api/settings/production-lines?is_active=true&limit=500')
        if (response.ok) {
          const data = await response.json()
          setProductionLines(data.production_lines || data.data || [])
        }
      } catch (error) {
        console.error('Error fetching production lines:', error)
      } finally {
        setLoadingLines(false)
      }
    }

    if (open) {
      fetchLines()
    }
  }, [open])

  const handleBomSelect = useCallback((bomId: string | null) => {
    setManualBomId(bomId)
    form.setValue('bom_id', bomId)
  }, [form])

  const onSubmit = async (values: WOFormValues) => {
    try {
      const input: CreateWOInput = {
        product_id: values.product_id,
        bom_id: values.bom_id || manualBomId || selectedBom?.bom_id || null,
        planned_quantity: values.planned_quantity,
        uom: values.uom,
        planned_start_date: values.planned_start_date,
        planned_end_date: values.planned_end_date || undefined,
        scheduled_start_time: values.scheduled_start_time || undefined,
        scheduled_end_time: values.scheduled_end_time || undefined,
        production_line_id: values.production_line_id || undefined,
        machine_id: values.machine_id || undefined,
        priority: values.priority,
        notes: values.notes || undefined,
      }

      if (isEditMode && workOrder) {
        await updateMutation.mutateAsync({
          id: workOrder.id,
          data: input,
        })
        toast({
          title: 'Success',
          description: 'Work order updated successfully',
        })
      } else {
        await createMutation.mutateAsync(input)
        toast({
          title: 'Success',
          description: 'Work order created successfully',
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save work order',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Work Order' : 'Create Work Order'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update work order details'
                : 'Create a new work order. WO number will be auto-generated.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product */}
                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Product <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={loadingProducts || isEditMode}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingProducts ? 'Loading...' : 'Select product'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.code} - {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantity */}
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="planned_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Quantity <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              min="0.001"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="uom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UoM</FormLabel>
                          <FormControl>
                            <Input {...field} disabled placeholder="Auto from product" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Scheduled Date */}
                  <FormField
                    control={form.control}
                    name="planned_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Scheduled Date <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* End Date */}
                  <FormField
                    control={form.control}
                    name="planned_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            min={scheduledDate}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Production Line */}
                  <FormField
                    control={form.control}
                    name="production_line_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Production Line</FormLabel>
                        <Select
                          value={field.value || 'none'}
                          onValueChange={(value) =>
                            field.onChange(value === 'none' ? null : value)
                          }
                          disabled={loadingLines}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingLines ? 'Loading...' : 'Select line (optional)'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {productionLines.map((line) => (
                              <SelectItem key={line.id} value={line.id}>
                                {line.code} - {line.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Priority */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(WO_PRIORITY_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* BOM Preview Section */}
              {!isEditMode && selectedProductId && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                    BOM Selection
                  </h3>
                  <WOBomPreview
                    bom={selectedBom}
                    isLoading={bomLoading}
                    error={bomError?.message}
                    onChangeBom={() => setBomSelectionOpen(true)}
                    quantity={plannedQuantity}
                  />
                  {selectedBom && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        BOM materials will be snapshotted when the work order is created.
                        Changes to the BOM after creation will not affect this work order.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional production notes..."
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>Maximum 2000 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? 'Update' : 'Create Work Order'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* BOM Selection Modal */}
      <WOBomSelectionModal
        open={bomSelectionOpen}
        onOpenChange={setBomSelectionOpen}
        boms={availableBoms}
        selectedBomId={manualBomId || selectedBom?.bom_id || null}
        onSelect={handleBomSelect}
        isLoading={availableBomsLoading}
        scheduledDate={scheduledDate}
        productName={products.find((p) => p.id === selectedProductId)?.name}
      />
    </>
  )
}

export default WOForm
