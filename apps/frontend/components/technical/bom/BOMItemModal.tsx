/**
 * BOMItemModal Component (Story 02.5a - MVP + 02.5b Phase 1B)
 * Add/Edit modal for BOM items with MVP and Phase 1B fields
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
 * Phase 1B Features:
 * - consume_whole_lp checkbox
 * - is_by_product checkbox with yield_percent calculation
 * - condition_flags multi-select (ConditionalFlagsSelect)
 * - line_ids checkboxes (ProductionLinesCheckbox)
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
 * - AC-01 (02.5b): Conditional flags save as JSONB
 * - AC-03 (02.5b): Line-specific items save line_ids array
 * - AC-04 (02.5b): Consume whole LP checkbox works
 * - AC-02 (02.5b): By-products with yield tracking
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { bomItemFormSchema, type BOMItemFormValues } from '@/lib/validation/bom-items'
import type {
  BOMItem,
  BOMItemWarning,
  CreateBOMItemRequest,
  UpdateBOMItemRequest,
  RoutingOperationOption,
  ConditionFlags,
  ProductionLine,
} from '@/lib/types/bom'
import { ConditionalFlagsSelect } from './ConditionalFlagsSelect'
import { ProductionLinesCheckbox } from './ProductionLinesCheckbox'
import { BOM_ITEM_DEFAULTS } from '@/lib/constants/bom-items'

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
  /** BOM output quantity for yield calculation (Phase 1B) */
  bomOutputQty?: number
  /** BOM output UoM for yield display (Phase 1B) */
  bomOutputUom?: string
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
  bomOutputQty = 1,
  bomOutputUom = 'kg',
  onSave,
}: BOMItemModalProps) {
  const [saving, setSaving] = useState(false)
  const [warnings, setWarnings] = useState<BOMItemWarning[]>([])
  const [operations, setOperations] = useState<RoutingOperationOption[]>([])
  const [loadingOperations, setLoadingOperations] = useState(false)
  const [selectedProductUom, setSelectedProductUom] = useState<string>('')
  const [serverError, setServerError] = useState<string | null>(null)

  // Phase 1B state
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([])
  const [loadingLines, setLoadingLines] = useState(false)

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
      // Phase 1B fields
      consume_whole_lp: item?.consume_whole_lp ?? BOM_ITEM_DEFAULTS.CONSUME_WHOLE_LP,
      line_ids: item?.line_ids ?? BOM_ITEM_DEFAULTS.LINE_IDS,
      is_by_product: item?.is_by_product ?? BOM_ITEM_DEFAULTS.IS_BY_PRODUCT,
      yield_percent: item?.yield_percent ?? BOM_ITEM_DEFAULTS.YIELD_PERCENT,
      condition_flags: item?.condition_flags ?? BOM_ITEM_DEFAULTS.CONDITION_FLAGS,
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
          // Phase 1B fields
          consume_whole_lp: item.consume_whole_lp ?? BOM_ITEM_DEFAULTS.CONSUME_WHOLE_LP,
          line_ids: item.line_ids ?? BOM_ITEM_DEFAULTS.LINE_IDS,
          is_by_product: item.is_by_product ?? BOM_ITEM_DEFAULTS.IS_BY_PRODUCT,
          yield_percent: item.yield_percent ?? BOM_ITEM_DEFAULTS.YIELD_PERCENT,
          condition_flags: item.condition_flags ?? BOM_ITEM_DEFAULTS.CONDITION_FLAGS,
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
          // Phase 1B fields - defaults
          consume_whole_lp: BOM_ITEM_DEFAULTS.CONSUME_WHOLE_LP,
          line_ids: BOM_ITEM_DEFAULTS.LINE_IDS,
          is_by_product: BOM_ITEM_DEFAULTS.IS_BY_PRODUCT,
          yield_percent: BOM_ITEM_DEFAULTS.YIELD_PERCENT,
          condition_flags: BOM_ITEM_DEFAULTS.CONDITION_FLAGS,
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

  // Fetch production lines for Phase 1B line_ids field
  useEffect(() => {
    if (open) {
      setLoadingLines(true)
      fetch('/api/v1/settings/production-lines?status=active')
        .then((res) => res.json())
        .then((data) => {
          setProductionLines(data.data || [])
        })
        .catch(() => {
          setProductionLines([])
        })
        .finally(() => {
          setLoadingLines(false)
        })
    }
  }, [open])

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

  // Watch is_by_product to show/hide yield_percent field
  const isByProduct = form.watch('is_by_product')
  const watchedQuantity = form.watch('quantity')

  // Calculate yield percent when quantity changes (for by-products)
  const calculatedYieldPercent = useMemo(() => {
    if (!isByProduct || !watchedQuantity || bomOutputQty <= 0) return null
    return Number(((watchedQuantity / bomOutputQty) * 100).toFixed(2))
  }, [isByProduct, watchedQuantity, bomOutputQty])

  // Auto-update yield_percent when quantity changes for by-products
  useEffect(() => {
    if (isByProduct && calculatedYieldPercent !== null) {
      form.setValue('yield_percent', calculatedYieldPercent)
    }
  }, [calculatedYieldPercent, isByProduct, form])

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
          // Phase 1B fields
          consume_whole_lp: data.consume_whole_lp,
          line_ids: data.line_ids,
          is_by_product: data.is_by_product,
          yield_percent: data.is_by_product ? data.yield_percent : null,
          condition_flags: data.condition_flags as ConditionFlags | null,
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
          // Phase 1B fields
          consume_whole_lp: data.consume_whole_lp,
          line_ids: data.line_ids,
          is_by_product: data.is_by_product,
          yield_percent: data.is_by_product ? data.yield_percent : null,
          condition_flags: data.condition_flags as ConditionFlags | null,
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

            {/* ========================================
                Phase 1B Fields Section
                ======================================== */}
            <Separator className="my-4" />

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Advanced Options (Phase 1B)</h4>

              {/* Consume Whole LP Checkbox */}
              <FormField
                control={form.control}
                name="consume_whole_lp"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={saving}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <div className="flex items-center gap-2">
                        <FormLabel className="cursor-pointer">Consume Whole LP</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                When enabled, production must consume the entire License Plate (LP).
                                No partial consumption allowed - the full LP quantity will be used.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormDescription>
                        Require full LP consumption during production
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Is By-Product Checkbox + Yield Percent */}
              <FormField
                control={form.control}
                name="is_by_product"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={saving}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-1">
                      <FormLabel className="cursor-pointer">By-Product (Output)</FormLabel>
                      <FormDescription>
                        Mark this item as a by-product output instead of an input ingredient
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Yield Percent (shown only when is_by_product is true) */}
              {isByProduct && (
                <FormField
                  control={form.control}
                  name="yield_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yield Percent</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0.00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                            }
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Auto-calculated: {watchedQuantity || 0} {form.watch('uom') || 'units'} / {bomOutputQty} {bomOutputUom} = {calculatedYieldPercent ?? 0}%
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Conditional Flags Multi-Select */}
              <FormField
                control={form.control}
                name="condition_flags"
                render={({ field }) => (
                  <FormItem>
                    <ConditionalFlagsSelect
                      value={field.value as ConditionFlags | null}
                      onChange={field.onChange}
                      disabled={saving}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Production Lines Checkboxes */}
              <FormField
                control={form.control}
                name="line_ids"
                render={({ field }) => (
                  <FormItem>
                    <ProductionLinesCheckbox
                      value={field.value}
                      onChange={field.onChange}
                      disabled={saving}
                      productionLines={productionLines}
                      loading={loadingLines}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
