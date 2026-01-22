/**
 * SO Line Form Component
 * Story 07.2, 07.4: Sales Order Line with Pricing
 *
 * Form for adding/editing order lines:
 * - Product selection with auto-price population
 * - Real-time line total calculation
 * - Discount input with validation
 * - Inventory availability check
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { SalesOrderService } from '@/lib/services/sales-order-service'

// =============================================================================
// Types
// =============================================================================

interface Product {
  id: string
  name: string
  code?: string
  std_price: number | null
  available_qty?: number
}

interface LineFormData {
  product_id: string
  quantity_ordered: number
  unit_price: number
  discount_type?: 'percent' | 'fixed' | null
  discount_value?: number | null
  notes?: string
}

interface SOLineFormProps {
  salesOrderId: string
  onLineChange?: (data: LineFormData & { line_total: number }) => void
  onLineSave: (data: LineFormData) => void
  products: Product[]
  initialData?: Partial<LineFormData>
  isLoading?: boolean
}

// =============================================================================
// Validation
// =============================================================================

const lineSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity_ordered: z.number().positive('Quantity must be greater than zero'),
  unit_price: z.number().positive('Unit price must be greater than zero'),
  discount_type: z.enum(['percent', 'fixed']).nullable().optional(),
  discount_value: z.number().nonnegative('Discount cannot be negative').nullable().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Validate percentage discount <= 100%
  if (data.discount_type === 'percent' && data.discount_value && data.discount_value > 100) {
    return false
  }
  return true
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['discount_value'],
})

// =============================================================================
// Component
// =============================================================================

export function SOLineForm({
  salesOrderId,
  onLineChange,
  onLineSave,
  products,
  initialData,
  isLoading = false,
}: SOLineFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [showNoPriceWarning, setShowNoPriceWarning] = useState(false)

  const form = useForm<LineFormData>({
    resolver: zodResolver(lineSchema),
    mode: 'all',
    defaultValues: {
      product_id: initialData?.product_id || '',
      quantity_ordered: initialData?.quantity_ordered || 0,
      unit_price: initialData?.unit_price || 0,
      discount_type: initialData?.discount_type || null,
      discount_value: initialData?.discount_value || null,
      notes: initialData?.notes || '',
    },
  })

  const watchAll = form.watch()
  const selectedProduct = products.find((p) => p.id === watchAll.product_id)

  // Calculate line total
  const lineTotal = SalesOrderService.calculateLineTotal(
    watchAll.quantity_ordered || 0,
    watchAll.unit_price || 0,
    watchAll.discount_type && watchAll.discount_value != null
      ? { type: watchAll.discount_type, value: watchAll.discount_value }
      : null
  )

  // Auto-populate price when product changes
  const handleProductChange = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      if (product.std_price === null || product.std_price === undefined) {
        setShowNoPriceWarning(true)
        form.setValue('unit_price', 0)
      } else {
        setShowNoPriceWarning(false)
        form.setValue('unit_price', product.std_price)
      }
    }
    form.setValue('product_id', productId)
  }, [products, form])

  // Notify parent of changes
  useEffect(() => {
    if (onLineChange) {
      onLineChange({
        ...watchAll,
        line_total: lineTotal,
      })
    }
  }, [watchAll, lineTotal, onLineChange])

  // Handle save
  const handleSubmit = async (data: LineFormData) => {
    try {
      setIsSaving(true)
      await onLineSave(data)
    } finally {
      setIsSaving(false)
    }
  }

  // Check inventory availability
  const isOverAllocated = selectedProduct?.available_qty !== undefined &&
    watchAll.quantity_ordered > (selectedProduct.available_qty || 0)

  // Disable save if validation fails
  const isValid = form.formState.isValid && watchAll.unit_price > 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Product Selection */}
        <FormField
          control={form.control}
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product *</FormLabel>
              <Select
                value={field.value}
                onValueChange={handleProductChange}
              >
                <FormControl>
                  <SelectTrigger role="combobox" aria-label="Product">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showNoPriceWarning && (
                <FormDescription className="text-amber-600 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Product has no standard price. Please enter a price.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Quantity */}
          <FormField
            control={form.control}
            name="quantity_ordered"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    aria-label="Quantity"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                {isOverAllocated && (
                  <FormDescription className="text-amber-600">
                    Available: {selectedProduct?.available_qty || 0}, Requested: {watchAll.quantity_ordered}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unit Price */}
          <FormField
            control={form.control}
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    aria-label="Unit Price"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Discount */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="discount_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select
                  value={field.value || 'none'}
                  onValueChange={(value) =>
                    field.onChange(value === 'none' ? null : value)
                  }
                >
                  <FormControl>
                    <SelectTrigger role="combobox" aria-label="Discount type">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchAll.discount_type && (
            <FormField
              control={form.control}
              name="discount_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={watchAll.discount_type === 'percent' ? 1 : 0.01}
                      max={watchAll.discount_type === 'percent' ? 100 : undefined}
                      aria-label="Discount value"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Line Total Display */}
        <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Line Total:</span>
          <span className="text-xl font-bold">
            {SalesOrderService.formatCurrency(lineTotal)}
          </span>
        </div>

        {/* Save Button */}
        <Button type="submit" disabled={isSaving || !isValid}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </form>
    </Form>
  )
}

export default SOLineForm
