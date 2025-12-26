/**
 * BOMHeaderForm Component (Story 02.4)
 * Create/Edit form for BOM header information
 *
 * Features:
 * - Product selector (locked in edit mode)
 * - Date pickers for effective dates
 * - Status selection
 * - Output quantity and UOM
 * - Notes textarea
 * - Form validation with Zod
 * - Date range validation
 * - Auto-version display (create mode)
 *
 * Acceptance Criteria:
 * - AC-08 to AC-13: Create BOM with all fields
 * - AC-14 to AC-17: Edit BOM (product locked)
 * - AC-18 to AC-20: Date range validation
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, AlertCircle, Info } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ProductSelector } from './ProductSelector'
import { useNextBOMVersion } from '@/lib/hooks/use-boms'
import type { BOMWithProduct, BOMStatus, BOMFormData } from '@/lib/types/bom'

// Form schema for BOM header
const bomFormSchema = z
  .object({
    product_id: z.string().uuid('Please select a product'),
    effective_from: z.date({
      required_error: 'Effective from date is required',
    }),
    effective_to: z.date().nullable().optional(),
    status: z.enum(['draft', 'active'] as const),
    output_qty: z.coerce
      .number()
      .positive('Output quantity must be greater than 0')
      .max(999999999, 'Output quantity too large'),
    output_uom: z
      .string()
      .min(1, 'Unit of measure is required')
      .max(20, 'Unit of measure too long'),
    notes: z.string().max(2000, 'Notes too long').nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.effective_to && data.effective_from) {
        return data.effective_to >= data.effective_from
      }
      return true
    },
    {
      message: 'Effective To must be after Effective From',
      path: ['effective_to'],
    }
  )

type BOMFormValues = z.infer<typeof bomFormSchema>

interface BOMHeaderFormProps {
  mode: 'create' | 'edit'
  bom?: BOMWithProduct | null
  onSubmit: (data: BOMFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  error?: string | null
}

export function BOMHeaderForm({
  mode,
  bom,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
}: BOMHeaderFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    bom?.product_id || null
  )
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string
    code: string
    name: string
    type: string
    uom: string
  } | null>(bom?.product || null)

  // Fetch next version for create mode
  const { data: nextVersion, isLoading: versionLoading } = useNextBOMVersion(
    mode === 'create' ? selectedProductId : null
  )

  // Initialize form with default or existing values
  const form = useForm<BOMFormValues>({
    resolver: zodResolver(bomFormSchema),
    defaultValues: {
      product_id: bom?.product_id || '',
      effective_from: bom?.effective_from
        ? new Date(bom.effective_from)
        : new Date(),
      effective_to: bom?.effective_to ? new Date(bom.effective_to) : null,
      status: bom?.status === 'active' ? 'active' : 'draft',
      output_qty: bom?.output_qty || 1,
      output_uom: bom?.output_uom || selectedProduct?.uom || 'EA',
      notes: bom?.notes || '',
    },
  })

  // Update UOM when product changes
  useEffect(() => {
    if (selectedProduct && mode === 'create') {
      form.setValue('output_uom', selectedProduct.uom || 'EA')
    }
  }, [selectedProduct, mode, form])

  // Handle product selection
  const handleProductChange = (
    productId: string | null,
    product: { id: string; code: string; name: string; type: string; uom: string } | null
  ) => {
    setSelectedProductId(productId)
    setSelectedProduct(product)
    form.setValue('product_id', productId || '')
    if (product) {
      form.setValue('output_uom', product.uom || 'EA')
    }
  }

  // Handle form submission
  const handleSubmit = async (values: BOMFormValues) => {
    const formData: BOMFormData = {
      product_id: values.product_id,
      effective_from: format(values.effective_from, 'yyyy-MM-dd'),
      effective_to: values.effective_to
        ? format(values.effective_to, 'yyyy-MM-dd')
        : null,
      status: values.status,
      output_qty: values.output_qty,
      output_uom: values.output_uom,
      notes: values.notes || null,
    }

    await onSubmit(formData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Product Selector */}
        <FormField
          control={form.control}
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product *</FormLabel>
              <FormControl>
                <ProductSelector
                  value={field.value || null}
                  onChange={handleProductChange}
                  disabled={mode === 'edit'}
                  locked={mode === 'edit'}
                  lockedProduct={bom?.product || null}
                  aria-label="Select product for BOM"
                />
              </FormControl>
              <FormDescription>
                {mode === 'create'
                  ? 'Select the finished good or WIP product'
                  : 'Product cannot be changed after creation'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Version Display (Create mode only) */}
        {mode === 'create' && selectedProductId && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              This will be version:{' '}
              {versionLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <Badge variant="secondary" className="font-mono">
                  v{nextVersion || 1}
                </Badge>
              )}
            </span>
          </div>
        )}

        {/* Edit mode - show current version */}
        {mode === 'edit' && bom && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Current version:{' '}
              <Badge variant="secondary" className="font-mono">
                v{bom.version}
              </Badge>
            </span>
          </div>
        )}

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Effective From */}
          <FormField
            control={form.control}
            name="effective_from"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Effective From *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>When this BOM becomes active</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Effective To */}
          <FormField
            control={form.control}
            name="effective_to"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Effective To</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Ongoing (no end date)</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < form.getValues('effective_from')
                      }
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => field.onChange(null)}
                      >
                        Clear (Ongoing)
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Leave empty for ongoing validity
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Draft BOMs are not used in production planning
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Output Quantity and UOM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="output_qty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Output Quantity *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Quantity produced per batch
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="output_uom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measure *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="EA, KG, L, etc." />
                </FormControl>
                <FormDescription>Output unit of measure</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Optional notes about this BOM version..."
                  rows={3}
                />
              </FormControl>
              <FormDescription>Max 2000 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === 'create'
                ? 'Creating...'
                : 'Saving...'
              : mode === 'create'
              ? 'Create BOM'
              : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default BOMHeaderForm
