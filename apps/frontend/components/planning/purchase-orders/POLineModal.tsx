/**
 * PO Line Modal Component
 * Story 03.3: PO CRUD + Lines
 * Add/Edit line modal with product search per PLAN-009
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Search, Check, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSupplierProductPrice } from '@/lib/hooks/use-purchase-orders'
import type {
  POLine,
  CreatePOLineInput,
  ProductSummary,
  TaxCodeSummary,
  Currency,
} from '@/lib/types/purchase-order'
import { calculateLineTotal, calculateLineTax } from '@/lib/types/purchase-order'

const poLineSchema = z.object({
  product_id: z.string().uuid({ message: 'Please select a product' }),
  quantity: z.number().positive({ message: 'Quantity must be greater than 0' }),
  unit_price: z.number().min(0, { message: 'Unit price cannot be negative' }),
  tax_code_id: z.string().uuid({ message: 'Please select a tax code' }),
  discount_percent: z.number().min(0).max(100).optional().default(0),
  notes: z.string().max(500).optional().nullable(),
})

type POLineFormData = z.infer<typeof poLineSchema>

interface POLineModalProps {
  isOpen: boolean
  mode: 'add' | 'edit'
  initialData?: POLine | null
  supplierId: string
  taxCodeId: string
  currency: Currency
  taxCodes: TaxCodeSummary[]
  existingProductIds?: string[]
  onSubmit: (data: CreatePOLineInput) => Promise<void>
  onClose: () => void
}

const formatCurrency = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function POLineModal({
  isOpen,
  mode,
  initialData,
  supplierId,
  taxCodeId,
  currency,
  taxCodes,
  existingProductIds = [],
  onSubmit,
  onClose,
}: POLineModalProps) {
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(
    initialData?.product || null
  )
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get supplier-specific price
  const { data: supplierPrice, isLoading: isLoadingPrice } = useSupplierProductPrice(
    supplierId,
    selectedProduct?.id || null
  )

  const form = useForm<POLineFormData>({
    resolver: zodResolver(poLineSchema),
    defaultValues: {
      product_id: initialData?.product_id || '',
      quantity: initialData?.quantity || 0,
      unit_price: initialData?.unit_price || 0,
      tax_code_id: initialData?.tax_code_id || taxCodeId,
      discount_percent: initialData?.discount_percent || 0,
      notes: initialData?.notes || '',
    },
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          product_id: initialData.product_id,
          quantity: initialData.quantity,
          unit_price: initialData.unit_price,
          tax_code_id: initialData.tax_code_id,
          discount_percent: initialData.discount_percent || 0,
          notes: initialData.notes || '',
        })
        setSelectedProduct(initialData.product || null)
      } else {
        form.reset({
          product_id: '',
          quantity: 0,
          unit_price: 0,
          tax_code_id: taxCodeId,
          discount_percent: 0,
          notes: '',
        })
        setSelectedProduct(null)
      }
      setShowDuplicateWarning(false)
      setSearchQuery('')
      setProducts([])
    }
  }, [isOpen, initialData, taxCodeId, form])

  // Search products
  const searchProducts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setProducts([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/technical/products?search=${encodeURIComponent(query)}&purchasable=true&limit=10`
      )
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data || data.products || [])
      }
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchProducts])

  // Handle product selection
  const handleProductSelect = useCallback(
    (product: ProductSummary) => {
      setSelectedProduct(product)
      form.setValue('product_id', product.id)
      setProductSearchOpen(false)

      // Check for duplicate
      if (existingProductIds.includes(product.id) && mode === 'add') {
        setShowDuplicateWarning(true)
      } else {
        setShowDuplicateWarning(false)
      }
    },
    [existingProductIds, mode, form]
  )

  // Update price when supplier price is loaded
  useEffect(() => {
    if (selectedProduct && !initialData) {
      if (supplierPrice?.price) {
        form.setValue('unit_price', supplierPrice.price)
      } else if (selectedProduct.std_price) {
        form.setValue('unit_price', selectedProduct.std_price)
      }
    }
  }, [supplierPrice, selectedProduct, initialData, form])

  // Calculate totals
  const watchedValues = form.watch(['quantity', 'unit_price', 'discount_percent', 'tax_code_id'])
  const calculatedTotals = useMemo(() => {
    const [quantity, unitPrice, discountPercent, selectedTaxCodeId] = watchedValues
    const taxCode = taxCodes.find((t) => t.id === selectedTaxCodeId)
    const taxRate = taxCode?.rate || 0

    const lineTotal = calculateLineTotal(quantity || 0, unitPrice || 0, discountPercent || 0)
    const taxAmount = calculateLineTax(lineTotal, taxRate)
    const totalWithTax = lineTotal + taxAmount

    return { lineTotal, taxAmount, totalWithTax, taxRate }
  }, [watchedValues, taxCodes])

  // Handle submit
  const handleSubmit = async (data: POLineFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        product_id: data.product_id,
        quantity: data.quantity,
        unit_price: data.unit_price,
        tax_code_id: data.tax_code_id,
        discount_percent: data.discount_percent,
        notes: data.notes,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add PO Line' : 'Edit PO Line'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Product Selection */}
            {mode === 'add' ? (
              <div className="space-y-2">
                <FormLabel>Product *</FormLabel>
                <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedProduct ? (
                        <span className="truncate">
                          {selectedProduct.name} ({selectedProduct.code})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Search by name or code...</span>
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search products..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        {isSearching ? (
                          <div className="p-4 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : products.length === 0 && searchQuery.length >= 2 ? (
                          <CommandEmpty>No products found.</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {products.map((product) => (
                              <CommandItem
                                key={product.id}
                                value={product.id}
                                onSelect={() => handleProductSelect(product)}
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {product.code} | {product.base_uom} |{' '}
                                    {formatCurrency(product.std_price, currency)}
                                  </div>
                                </div>
                                {selectedProduct?.id === product.id && (
                                  <Check className="h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.product_id && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.product_id.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <FormLabel>Product</FormLabel>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="font-medium">{selectedProduct?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedProduct?.code} | {selectedProduct?.base_uom}
                  </div>
                </div>
              </div>
            )}

            {/* Selected Product Info */}
            {selectedProduct && (
              <div className="border rounded-lg p-3 bg-blue-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{selectedProduct.name}</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Standard Price:</span>
                    <span>{formatCurrency(selectedProduct.std_price, currency)}</span>
                  </div>
                  {isLoadingPrice ? (
                    <Skeleton className="h-4 w-full" />
                  ) : supplierPrice ? (
                    <div className="flex justify-between text-green-700">
                      <span>Supplier Price:</span>
                      <span>{formatCurrency(supplierPrice.price, currency)}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Duplicate Warning */}
            {showDuplicateWarning && (
              <Alert variant="default" className="border-yellow-300 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  This product is already on the PO. Adding will create a duplicate line.
                </AlertDescription>
              </Alert>
            )}

            {/* Quantity and UOM */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Unit of Measure</FormLabel>
                <Input
                  value={selectedProduct?.base_uom || '-'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Unit Price and Tax Code */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    {supplierPrice && (
                      <p className="text-xs text-green-600 mt-1">
                        Pre-filled from supplier price
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tax_code_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Code</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tax code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {taxCodes.map((taxCode) => (
                          <SelectItem key={taxCode.id} value={taxCode.id}>
                            {taxCode.name} ({taxCode.rate}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Discount */}
            <FormField
              control={form.control}
              name="discount_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount %</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calculated Values */}
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Line Total:</span>
                  <span className="font-medium">
                    {formatCurrency(calculatedTotals.lineTotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tax ({calculatedTotals.taxRate}%):
                  </span>
                  <span>{formatCurrency(calculatedTotals.taxAmount, currency)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-medium">
                  <span>Total with Tax:</span>
                  <span>{formatCurrency(calculatedTotals.totalWithTax, currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes for this line..."
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedProduct}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'add' ? 'Adding...' : 'Saving...'}
                  </>
                ) : mode === 'add' ? (
                  'Add Line'
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default POLineModal
