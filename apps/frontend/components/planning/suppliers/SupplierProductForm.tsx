/**
 * SupplierProductForm Component
 * Story: 03.2 - Supplier-Product Assignment
 *
 * Reusable form for creating/editing supplier-product assignments
 */

'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductSelectorCombobox } from './ProductSelectorCombobox'
import {
  SUPPORTED_CURRENCIES,
  type AssignProductInput,
  type UpdateSupplierProductInput,
} from '@/lib/validation/supplier-product-validation'
import type { SupplierProductWithProduct } from '@/lib/types/supplier-product'

// Form schema that works for both create and update
const formSchema = z.object({
  product_id: z.string().optional(),
  is_default: z.boolean().default(false),
  supplier_product_code: z.string().max(50, 'Max 50 characters').optional().nullable(),
  unit_price: z.number().positive('Price must be positive').optional().nullable(),
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']).optional().nullable(),
  lead_time_days: z.number().int('Must be a whole number').nonnegative('Cannot be negative').optional().nullable(),
  moq: z.number().positive('MOQ must be positive').optional().nullable(),
  order_multiple: z.number().positive('Order multiple must be positive').optional().nullable(),
  notes: z.string().max(1000, 'Max 1000 characters').optional().nullable(),
})

type FormData = z.infer<typeof formSchema>

interface SupplierProductFormProps {
  initialData?: SupplierProductWithProduct | null
  onSubmit: (data: AssignProductInput | UpdateSupplierProductInput) => Promise<void>
  isLoading: boolean
  showProductSelector: boolean
  excludeProductIds?: string[]
  onCancel?: () => void
}

/**
 * SupplierProductForm - Form for supplier-product assignments
 *
 * Features:
 * - Shared between AssignProductModal and edit mode
 * - Zod validation integration
 * - Error display per field
 * - All optional override fields
 */
export function SupplierProductForm({
  initialData,
  onSubmit,
  isLoading,
  showProductSelector,
  excludeProductIds = [],
  onCancel,
}: SupplierProductFormProps) {
  const isEdit = !!initialData

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: initialData?.product_id || '',
      is_default: initialData?.is_default || false,
      supplier_product_code: initialData?.supplier_product_code || '',
      unit_price: initialData?.unit_price ?? undefined,
      currency: (initialData?.currency as FormData['currency']) || undefined,
      lead_time_days: initialData?.lead_time_days ?? undefined,
      moq: initialData?.moq ?? undefined,
      order_multiple: initialData?.order_multiple ?? undefined,
      notes: initialData?.notes || '',
    },
  })

  const notesValue = watch('notes')

  const onFormSubmit = async (rawData: unknown) => {
    const data = rawData as FormData;
    // Clean up and prepare the data
    const cleanedData = {
      ...data,
      product_id: data.product_id || undefined,
      supplier_product_code: data.supplier_product_code || null,
      unit_price: data.unit_price ?? null,
      currency: data.currency || null,
      lead_time_days: data.lead_time_days ?? null,
      moq: data.moq ?? null,
      order_multiple: data.order_multiple ?? null,
      notes: data.notes || null,
    }

    // Validate product_id for new assignments
    if (showProductSelector && !cleanedData.product_id) {
      return
    }

    await onSubmit(cleanedData as AssignProductInput | UpdateSupplierProductInput)
  }

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-6"
      aria-label="Supplier product form"
    >
      {/* Product Selector - only shown for new assignments */}
      {showProductSelector && (
        <div className="space-y-2">
          <Label htmlFor="product_id">Product *</Label>
          <Controller
            name="product_id"
            control={control}
            rules={{ required: 'Product is required' }}
            render={({ field }) => (
              <ProductSelectorCombobox
                value={field.value || null}
                onChange={field.onChange}
                excludeIds={excludeProductIds}
                disabled={isLoading}
              />
            )}
          />
          <p className="text-sm text-muted-foreground">
            Select the product to assign to this supplier
          </p>
          {errors.product_id && (
            <p className="text-sm text-destructive">{errors.product_id.message}</p>
          )}
        </div>
      )}

      {/* Product display for edit mode */}
      {!showProductSelector && initialData?.product && (
        <div className="space-y-2">
          <Label>Product</Label>
          <div className="p-3 bg-muted rounded-md">
            <p className="font-medium">{initialData.product.name}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {initialData.product.code}
            </p>
          </div>
        </div>
      )}

      {/* Default Supplier Toggle */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">Set as Default Supplier</Label>
          <p className="text-sm text-muted-foreground">
            This supplier will be pre-selected when creating purchase orders for
            this product
          </p>
        </div>
        <Controller
          name="is_default"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isLoading}
              aria-label="Set as default supplier"
            />
          )}
        />
      </div>

      {/* Supplier Product Code */}
      <div className="space-y-2">
        <Label htmlFor="supplier_product_code">Supplier Product Code</Label>
        <Input
          id="supplier_product_code"
          {...register('supplier_product_code')}
          placeholder="e.g., MILL-FL-A"
          disabled={isLoading}
          maxLength={50}
        />
        <p className="text-sm text-muted-foreground">
          The supplier&apos;s internal code for this product (optional)
        </p>
        {errors.supplier_product_code && (
          <p className="text-sm text-destructive">{errors.supplier_product_code.message}</p>
        )}
      </div>

      {/* Price and Currency Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit_price">Unit Price</Label>
          <Controller
            name="unit_price"
            control={control}
            render={({ field }) => (
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                disabled={isLoading}
              />
            )}
          />
          {errors.unit_price && (
            <p className="text-sm text-destructive">{errors.unit_price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
                disabled={isLoading}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.currency && (
            <p className="text-sm text-destructive">{errors.currency.message}</p>
          )}
        </div>
      </div>

      {/* Lead Time */}
      <div className="space-y-2">
        <Label htmlFor="lead_time_days">Lead Time (days)</Label>
        <Controller
          name="lead_time_days"
          control={control}
          render={({ field }) => (
            <Input
              id="lead_time_days"
              type="number"
              min="0"
              step="1"
              placeholder="Enter lead time in days"
              value={field.value ?? ''}
              onChange={(e) =>
                field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
              }
              disabled={isLoading}
            />
          )}
        />
        <p className="text-sm text-muted-foreground">
          Overrides the product&apos;s default lead time
        </p>
        {errors.lead_time_days && (
          <p className="text-sm text-destructive">{errors.lead_time_days.message}</p>
        )}
      </div>

      {/* MOQ and Order Multiple Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="moq">Minimum Order Quantity</Label>
          <Controller
            name="moq"
            control={control}
            render={({ field }) => (
              <Input
                id="moq"
                type="number"
                min="0"
                step="1"
                placeholder="Enter MOQ"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                disabled={isLoading}
              />
            )}
          />
          {errors.moq && (
            <p className="text-sm text-destructive">{errors.moq.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="order_multiple">Order Multiple</Label>
          <Controller
            name="order_multiple"
            control={control}
            render={({ field }) => (
              <Input
                id="order_multiple"
                type="number"
                min="0"
                step="1"
                placeholder="e.g., 10"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                disabled={isLoading}
              />
            )}
          />
          {errors.order_multiple && (
            <p className="text-sm text-destructive">{errors.order_multiple.message}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Additional notes about this supplier-product relationship..."
          disabled={isLoading}
          maxLength={1000}
          rows={3}
        />
        <p className="text-sm text-muted-foreground">
          {(notesValue?.length || 0)}/1000 characters
        </p>
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Assign Product'}
        </Button>
      </div>
    </form>
  )
}

export default SupplierProductForm
