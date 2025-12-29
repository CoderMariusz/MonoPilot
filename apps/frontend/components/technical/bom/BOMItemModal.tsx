/**
 * BOMItemModal Component (Story 02.5a - MVP)
 * Add/Edit modal for BOM items with MVP fields only
 *
 * Features:
 * - Create mode (item = null): Empty form, auto-sequence
 * - Edit mode (item provided): Pre-populated, component read-only
 * - Product search combobox (RM, ING, PKG, WIP types only)
 * - Auto-fill UoM from product
 * - Operation dropdown (if routing assigned)
 * - Validation with error display
 * - UoM mismatch warning display
 * - All 4 UI states
 *
 * Acceptance Criteria:
 * - AC-02-a: Add Item modal opens
 * - AC-02-b: Valid item creation
 * - AC-02-c: Validation errors displayed
 * - AC-03-a: Edit modal pre-population
 * - AC-05: Operation assignment from routing
 * - AC-06: UoM mismatch warning (non-blocking)
 * - AC-07: Quantity validation
 * - AC-08: Sequence auto-increment
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown, Loader2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { bomItemFormSchema, type BOMItemFormValues } from '@/lib/validation/bom-items'
import type {
  BOMItem,
  BOMItemWarning,
  CreateBOMItemRequest,
  UpdateBOMItemRequest,
  RoutingOperationOption,
} from '@/lib/types/bom'

// ========================================
// Type Definitions
// ========================================

interface Product {
  id: string
  code: string
  name: string
  type: string
  uom: string
}

export interface BOMItemModalProps {
  /** Whether modal is open */
  open: boolean
  /** Callback when modal is closed */
  onClose: () => void
  /** Mode: 'create' or 'edit' */
  mode: 'create' | 'edit'
  /** BOM ID for the item */
  bomId: string
  /** Routing ID for operation dropdown (null if no routing) */
  routingId?: string | null
  /** Existing item for edit mode */
  item?: BOMItem | null
  /** Default sequence for new items */
  defaultSequence?: number
  /** Callback on successful save */
  onSave: (data: CreateBOMItemRequest | UpdateBOMItemRequest, itemId?: string) => Promise<{ item: BOMItem; warnings?: BOMItemWarning[] }>
}

// ========================================
// Helper Hooks
// ========================================

/**
 * Debounce hook for search
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// ========================================
// Product Selector Component
// ========================================

interface ComponentSelectorProps {
  value: string
  onChange: (productId: string, product: Product) => void
  disabled?: boolean
  error?: string
}

function ComponentSelector({ value, onChange, disabled, error }: ComponentSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  // Fetch products for component selector
  const fetchProducts = useCallback(async (searchTerm: string) => {
    setLoading(true)
    setFetchError(null)

    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      // Filter to RM, ING, PKG, WIP types only (components that can be in BOM)
      params.append('type', 'RM,ING,PKG,WIP')
      params.append('status', 'active')
      params.append('limit', '20')

      const response = await fetch(`/api/technical/products?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data.data || [])
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch products when search changes
  useEffect(() => {
    if (open) {
      fetchProducts(debouncedSearch)
    }
  }, [debouncedSearch, open, fetchProducts])

  // Fetch selected product details when value changes
  useEffect(() => {
    if (value && !selectedProduct) {
      fetch(`/api/technical/products/${value}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setSelectedProduct(data.data)
          }
        })
        .catch(() => {
          // Ignore errors
        })
    }
  }, [value, selectedProduct])

  // Handle selection
  const handleSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      setSelectedProduct(product)
      onChange(productId, product)
    }
    setOpen(false)
    setSearch('')
  }

  // Display value
  const displayValue = selectedProduct
    ? `${selectedProduct.code} - ${selectedProduct.name}`
    : 'Search components...'

  // If disabled, show locked state
  if (disabled && selectedProduct) {
    return (
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2"
          aria-label="Component (locked)"
        >
          <span className="font-mono text-sm font-medium">{selectedProduct.code}</span>
          <span className="text-sm text-muted-foreground">{selectedProduct.name}</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {selectedProduct.type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          To change component, delete this item and add a new one
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select component"
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              !selectedProduct && 'text-muted-foreground',
              error && 'border-destructive'
            )}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by code or name..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {/* Loading State */}
              {loading && (
                <div className="p-4 space-y-2" role="status" aria-busy="true">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching...</span>
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}

              {/* Error State */}
              {!loading && fetchError && (
                <div className="p-4" role="alert">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{fetchError}</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 p-0 h-auto"
                    onClick={() => fetchProducts(debouncedSearch)}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !fetchError && products.length === 0 && (
                <CommandEmpty>
                  {search ? 'No components found.' : 'Type to search components...'}
                </CommandEmpty>
              )}

              {/* Success State - Product List */}
              {!loading && !fetchError && products.length > 0 && (
                <CommandGroup heading="Components (RM/ING/PKG/WIP)">
                  {products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id}
                      onSelect={handleSelect}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          'h-4 w-4',
                          value === product.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-1 items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {product.code}
                        </span>
                        <span className="text-sm text-muted-foreground truncate">
                          {product.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {product.type}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected product details */}
      {selectedProduct && (
        <div className="text-xs text-muted-foreground">
          Type: {selectedProduct.type} | Base UoM: {selectedProduct.uom}
        </div>
      )}
    </div>
  )
}

// ========================================
// Main Modal Component
// ========================================

export function BOMItemModal({
  open,
  onClose,
  mode,
  bomId,
  routingId = null,
  item = null,
  defaultSequence = 10,
  onSave,
}: BOMItemModalProps) {
  const [saving, setSaving] = useState(false)
  const [warnings, setWarnings] = useState<BOMItemWarning[]>([])
  const [operations, setOperations] = useState<RoutingOperationOption[]>([])
  const [loadingOperations, setLoadingOperations] = useState(false)
  const [selectedProductUom, setSelectedProductUom] = useState<string>('')
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = mode === 'edit'

  // Form setup with React Hook Form + Zod
  const form = useForm<BOMItemFormValues>({
    resolver: zodResolver(bomItemFormSchema),
    defaultValues: {
      product_id: item?.product_id || '',
      quantity: item?.quantity || 0,
      uom: item?.uom || '',
      sequence: item?.sequence ?? defaultSequence,
      operation_seq: item?.operation_seq ?? null,
      scrap_percent: item?.scrap_percent ?? 0,
      notes: item?.notes || '',
    },
  })

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          product_id: item.product_id,
          quantity: item.quantity,
          uom: item.uom,
          sequence: item.sequence,
          operation_seq: item.operation_seq,
          scrap_percent: item.scrap_percent,
          notes: item.notes || '',
        })
        setSelectedProductUom(item.product_base_uom)
      } else {
        form.reset({
          product_id: '',
          quantity: 0,
          uom: '',
          sequence: defaultSequence,
          operation_seq: null,
          scrap_percent: 0,
          notes: '',
        })
        setSelectedProductUom('')
      }
      setWarnings([])
      setServerError(null)
    }
  }, [open, item, defaultSequence, form])

  // Fetch routing operations for dropdown
  useEffect(() => {
    if (routingId && open) {
      setLoadingOperations(true)
      fetch(`/api/v1/technical/routings/${routingId}/operations`)
        .then((res) => res.json())
        .then((data) => {
          const ops = (data.data || []).map((op: { id: string; sequence: number; name: string }) => ({
            id: op.id,
            sequence: op.sequence,
            name: op.name,
            display_name: `Op ${op.sequence}: ${op.name}`,
          }))
          setOperations(ops)
        })
        .catch(() => {
          setOperations([])
        })
        .finally(() => {
          setLoadingOperations(false)
        })
    } else {
      setOperations([])
    }
  }, [routingId, open])

  // Handle product selection
  const handleProductSelect = useCallback(
    (productId: string, product: Product) => {
      form.setValue('product_id', productId)
      form.setValue('uom', product.uom)
      setSelectedProductUom(product.uom)
    },
    [form]
  )

  // Check for UoM mismatch warning
  const uomMismatch = useMemo(() => {
    const currentUom = form.watch('uom')
    if (selectedProductUom && currentUom && currentUom !== selectedProductUom) {
      return {
        code: 'UOM_MISMATCH',
        message: `UoM mismatch: component base UoM is '${selectedProductUom}', you entered '${currentUom}'.`,
        details: 'Unit conversion may be required during production. You can still save this item, but verify this is correct.',
      }
    }
    return null
  }, [form.watch('uom'), selectedProductUom])

  // Handle form submission
  const onSubmit = async (data: BOMItemFormValues) => {
    setSaving(true)
    setServerError(null)
    setWarnings([])

    try {
      if (isEdit && item) {
        // Update - exclude product_id
        const updateData: UpdateBOMItemRequest = {
          quantity: data.quantity,
          uom: data.uom,
          sequence: data.sequence,
          operation_seq: data.operation_seq,
          scrap_percent: data.scrap_percent,
          notes: data.notes,
        }
        const result = await onSave(updateData, item.id)
        if (result.warnings?.length) {
          setWarnings(result.warnings)
        }
      } else {
        // Create
        const createData: CreateBOMItemRequest = {
          product_id: data.product_id,
          quantity: data.quantity,
          uom: data.uom,
          sequence: data.sequence,
          operation_seq: data.operation_seq,
          scrap_percent: data.scrap_percent,
          notes: data.notes,
        }
        const result = await onSave(createData)
        if (result.warnings?.length) {
          setWarnings(result.warnings)
        }
      }

      // Close modal on success
      onClose()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  // Handle close
  const handleClose = () => {
    if (!saving) {
      form.reset()
      setWarnings([])
      setServerError(null)
      onClose()
    }
  }

  // Notes character count
  const notesLength = form.watch('notes')?.length || 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit Component: ${item?.product_code}` : 'Add Component to BOM'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the component details. Component cannot be changed after creation.'
              : 'Search and select a component to add to this BOM.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Server Error Alert */}
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* UoM Mismatch Warning (non-blocking) */}
            {uomMismatch && (
              <Alert className="border-amber-500 bg-amber-50 text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900">Warning</AlertTitle>
                <AlertDescription className="text-amber-800">
                  {uomMismatch.message}
                  <br />
                  <span className="text-xs">{uomMismatch.details}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Component Selector */}
            <FormField
              control={form.control}
              name="product_id"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Component *</FormLabel>
                  <FormControl>
                    <ComponentSelector
                      value={field.value}
                      onChange={handleProductSelect}
                      disabled={isEdit}
                      error={fieldState.error?.message}
                    />
                  </FormControl>
                  <FormDescription>
                    Search by code or name (RM, ING, PKG, WIP types only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity + UoM Row */}
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
                        step="0.000001"
                        min="0.000001"
                        placeholder="0.000000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>Amount per batch</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measure</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        className="bg-muted"
                        placeholder="From component"
                      />
                    </FormControl>
                    <FormDescription>From component</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sequence + Scrap Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sequence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sequence</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="10"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value, 10) : 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>Order in production (auto: max+10)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scrap_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scrap Allowance %</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : 0)
                          }
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>Expected material loss</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Operation Assignment */}
            <FormField
              control={form.control}
              name="operation_seq"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation Assignment (Optional)</FormLabel>
                  {routingId ? (
                    <>
                      <Select
                        value={field.value?.toString() || 'none'}
                        onValueChange={(v) =>
                          field.onChange(v === 'none' ? null : parseInt(v, 10))
                        }
                        disabled={loadingOperations}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select operation..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {operations.map((op) => (
                            <SelectItem key={op.sequence} value={op.sequence.toString()}>
                              {op.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Links this item to specific production step
                      </FormDescription>
                    </>
                  ) : (
                    <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>Assign a routing to BOM first to enable operation assignment</span>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Special handling notes (max 500 characters)"
                      rows={3}
                      maxLength={500}
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>Production instructions or special notes</span>
                    <span className={notesLength > 450 ? 'text-amber-600' : ''}>
                      {notesLength} / 500
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  'Save Changes'
                ) : (
                  'Save Item'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default BOMItemModal
