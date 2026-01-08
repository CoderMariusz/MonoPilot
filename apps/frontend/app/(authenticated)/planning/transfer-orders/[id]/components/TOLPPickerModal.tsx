/**
 * TO LP Picker Modal Component
 * Story 03.9b: TO License Plate Pre-selection
 * Modal to pre-select License Plates for Transfer Order lines
 * Pattern: ShadCN Dialog with DataTable (adapted from PLAN-025 wireframe)
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  Search,
  Package,
  AlertTriangle,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ============================================================================
// TYPES
// ============================================================================

export interface TOLine {
  id: string
  product_id: string
  product_name: string
  product_code: string
  requested_qty: number
  uom: string
}

export interface Warehouse {
  id: string
  code: string
  name: string
}

export interface AvailableLP {
  id: string
  lp_number: string
  lot_number: string | null
  expiry_date: string | null
  location: string | null
  available_qty: number
  uom: string
}

export interface LPSelection {
  lp_id: string
  lp_number: string
  quantity: number
  lot_number: string | null
  expiry_date: string | null
  location: string | null
  available_qty: number
}

interface LPPickerFilters {
  lot_number?: string
  expiry_from?: string
  expiry_to?: string
  search?: string
}

export interface TOLPPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (selections: LPSelection[]) => Promise<void>
  toId: string
  toLineId: string
  toLine: TOLine
  fromWarehouse: Warehouse
  existingAssignedQty?: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatNumber = (num: number) =>
  num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TOLPPickerModal({
  isOpen,
  onClose,
  onAssign,
  toId,
  toLineId,
  toLine,
  fromWarehouse,
  existingAssignedQty = 0,
}: TOLPPickerModalProps) {
  // Responsive detection
  const isMobile = useMediaQuery('(max-width: 768px)')

  // State
  const [availableLPs, setAvailableLPs] = useState<AvailableLP[]>([])
  const [selections, setSelections] = useState<Map<string, LPSelection>>(new Map())
  const [filters, setFilters] = useState<LPPickerFilters>({})
  const [filtersOpen, setFiltersOpen] = useState(!isMobile) // Collapsed on mobile by default
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Calculated values
  const totalSelected = useMemo(() => {
    let sum = 0
    selections.forEach((sel) => (sum += sel.quantity))
    return sum
  }, [selections])

  const totalWithExisting = totalSelected + existingAssignedQty
  const remainingQty = toLine.requested_qty - existingAssignedQty

  // Progress calculation
  const progressPercent = Math.min(
    100,
    Math.round((totalWithExisting / toLine.requested_qty) * 100)
  )

  // Validation state
  const isOverAllocated = totalWithExisting > toLine.requested_qty
  const isExactMatch = totalWithExisting === toLine.requested_qty
  const isUnderAllocated = totalWithExisting < toLine.requested_qty && totalSelected > 0

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchAvailableLPs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters.lot_number) params.set('lot_number', filters.lot_number)
      if (filters.expiry_from) params.set('expiry_from', filters.expiry_from)
      if (filters.expiry_to) params.set('expiry_to', filters.expiry_to)
      if (filters.search) params.set('search', filters.search)

      const response = await fetch(
        `/api/planning/transfer-orders/${toId}/lines/${toLineId}/available-lps?${params}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch available LPs')
      }

      const data = await response.json()
      setAvailableLPs(data.data?.lps || data.lps || [])
    } catch (err) {
      console.error('Error fetching LPs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load available LPs')
    } finally {
      setIsLoading(false)
    }
  }, [toId, toLineId, filters])

  // Fetch on open and filter change
  useEffect(() => {
    if (isOpen) {
      fetchAvailableLPs()
    }
  }, [isOpen, fetchAvailableLPs])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelections(new Map())
      setFilters({})
      setError(null)
    }
  }, [isOpen])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleToggleLP = (lp: AvailableLP, checked: boolean) => {
    const newSelections = new Map(selections)

    if (checked) {
      // Default quantity: min of available qty or remaining needed
      const defaultQty = Math.min(lp.available_qty, Math.max(0, remainingQty - totalSelected))
      newSelections.set(lp.id, {
        lp_id: lp.id,
        lp_number: lp.lp_number,
        quantity: defaultQty > 0 ? defaultQty : lp.available_qty,
        lot_number: lp.lot_number,
        expiry_date: lp.expiry_date,
        location: lp.location,
        available_qty: lp.available_qty,
      })
    } else {
      newSelections.delete(lp.id)
    }

    setSelections(newSelections)
  }

  const handleQuantityChange = (lpId: string, value: string) => {
    const selection = selections.get(lpId)
    if (!selection) return

    const qty = parseFloat(value) || 0
    const newSelections = new Map(selections)
    newSelections.set(lpId, { ...selection, quantity: qty })
    setSelections(newSelections)
  }

  const handleRemoveSelection = (lpId: string) => {
    const newSelections = new Map(selections)
    newSelections.delete(lpId)
    setSelections(newSelections)
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  const handleApplyFilters = () => {
    fetchAvailableLPs()
  }

  const handleSubmit = async () => {
    if (selections.size === 0) {
      toast({
        title: 'No LPs Selected',
        description: 'Please select at least one License Plate to assign.',
        variant: 'destructive',
      })
      return
    }

    if (isOverAllocated) {
      toast({
        title: 'Over-Allocation Error',
        description: `Total assigned (${formatNumber(totalWithExisting)} ${toLine.uom}) exceeds required quantity (${formatNumber(toLine.requested_qty)} ${toLine.uom}).`,
        variant: 'destructive',
      })
      return
    }

    // Validate individual LP quantities
    for (const [lpId, sel] of selections) {
      if (sel.quantity <= 0) {
        toast({
          title: 'Invalid Quantity',
          description: `${sel.lp_number} has invalid quantity. Please enter a positive number.`,
          variant: 'destructive',
        })
        return
      }
      if (sel.quantity > sel.available_qty) {
        toast({
          title: 'Quantity Exceeds Available',
          description: `${sel.lp_number} only has ${formatNumber(sel.available_qty)} ${toLine.uom} available.`,
          variant: 'destructive',
        })
        return
      }
    }

    try {
      setIsSubmitting(true)
      await onAssign(Array.from(selections.values()))
      toast({
        title: 'Success',
        description: `${selections.size} License Plate${selections.size > 1 ? 's' : ''} assigned successfully`,
      })
      onClose()
    } catch (err) {
      console.error('Error assigning LPs:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to assign License Plates',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderLoadingState = () => (
    <div className="py-12 text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600">Loading available LPs...</p>
      <p className="text-sm text-gray-500">Checking inventory in {fromWarehouse.name}</p>
      <div className="mt-4 max-w-sm mx-auto space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )

  const renderEmptyState = () => (
    <div className="py-12 text-center">
      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Available License Plates</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
        No LPs found for {toLine.product_name} in {fromWarehouse.name} with available quantity.
      </p>
      <div className="text-left max-w-sm mx-auto mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Possible reasons:</p>
        <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
          <li>All LPs are already assigned to other Transfer Orders</li>
          <li>No inventory received for this product</li>
          <li>All LPs are blocked, quarantined, or expired</li>
        </ul>
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={handleClearFilters}>
          Clear Filters
        </Button>
        <Button variant="outline" asChild>
          <a href="/warehouse/inventory" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            View All Inventory
          </a>
        </Button>
      </div>
    </div>
  )

  const renderErrorState = () => (
    <div className="py-12 text-center">
      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load License Plates</h3>
      <p className="text-sm text-gray-500 mb-2">{error}</p>
      <p className="text-xs text-gray-400 mb-4">Error Code: PLAN-025-LOAD-ERR</p>
      <div className="flex justify-center gap-3">
        <Button onClick={fetchAvailableLPs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )

  // Mobile LP card view
  const renderMobileLPCard = (lp: AvailableLP) => {
    const isSelected = selections.has(lp.id)
    const selection = selections.get(lp.id)
    const hasError = isSelected && selection && selection.quantity > lp.available_qty

    return (
      <Card
        key={lp.id}
        className={`${isSelected ? 'border-blue-500 bg-blue-50' : ''} ${
          hasError ? 'border-red-500 bg-red-50' : ''
        }`}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleToggleLP(lp, checked as boolean)}
                aria-label={`Select ${lp.lp_number}`}
              />
              <span className="font-mono font-medium">{lp.lp_number}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Lot: </span>
              <span>{lp.lot_number || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Expiry: </span>
              <span>{formatDate(lp.expiry_date)}</span>
            </div>
            <div>
              <span className="text-gray-500">Location: </span>
              <span>{lp.location || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Available: </span>
              <span className="font-medium">{formatNumber(lp.available_qty)} {lp.uom}</span>
            </div>
          </div>
          {isSelected && (
            <div className="pt-2 border-t">
              <Label htmlFor={`qty-${lp.id}`} className="text-xs text-gray-600">
                Assign Quantity
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id={`qty-${lp.id}`}
                  type="number"
                  min={0}
                  max={lp.available_qty}
                  step="0.01"
                  value={selection?.quantity || 0}
                  onChange={(e) => handleQuantityChange(lp.id, e.target.value)}
                  className={`font-mono ${hasError ? 'border-red-500' : ''}`}
                />
                <span className="text-sm text-gray-500">{toLine.uom}</span>
              </div>
              {hasError && (
                <p className="text-xs text-red-600 mt-1">
                  Max available: {formatNumber(lp.available_qty)} {lp.uom}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign License Plates</DialogTitle>
          <DialogDescription>
            Select License Plates to assign to this Transfer Order line
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-2">
          {/* Product Info Header */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{toLine.product_name}</p>
                <p className="text-sm text-gray-500">{toLine.product_code}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">TO Line Quantity</p>
                <p className="font-medium">
                  {formatNumber(toLine.requested_qty)} {toLine.uom}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Source Warehouse: <span className="font-medium">{fromWarehouse.name}</span> ({fromWarehouse.code})
            </p>
          </div>

          {/* Progress Indicator */}
          <div
            className={`p-4 rounded-lg border ${
              isOverAllocated
                ? 'bg-red-50 border-red-200'
                : isExactMatch
                ? 'bg-green-50 border-green-200'
                : isUnderAllocated
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Assigned: {formatNumber(totalWithExisting)} / {formatNumber(toLine.requested_qty)} {toLine.uom}
              </span>
              <span className="text-sm font-medium">{progressPercent}%</span>
            </div>
            <Progress
              value={Math.min(progressPercent, 100)}
              className={`h-2 ${
                isOverAllocated
                  ? '[&>div]:bg-red-500'
                  : isExactMatch
                  ? '[&>div]:bg-green-500'
                  : isUnderAllocated
                  ? '[&>div]:bg-yellow-500'
                  : ''
              }`}
            />
            {isUnderAllocated && (
              <p className="text-sm text-yellow-700 mt-2">
                {formatNumber(toLine.requested_qty - totalWithExisting)} {toLine.uom} remaining to assign
              </p>
            )}
            {isOverAllocated && (
              <p className="text-sm text-red-700 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Over-assigned by {formatNumber(totalWithExisting - toLine.requested_qty)} {toLine.uom}
              </p>
            )}
          </div>

          {/* Validation Warning */}
          {isOverAllocated && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Over-Allocation Error:</strong> Total assigned ({formatNumber(totalWithExisting)} {toLine.uom}) exceeds TO line quantity ({formatNumber(toLine.requested_qty)} {toLine.uom}). Reduce assigned quantities by at least {formatNumber(totalWithExisting - toLine.requested_qty)} {toLine.uom} to continue.
              </AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {filtersOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              {(filters.lot_number || filters.expiry_from || filters.expiry_to || filters.search) && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
            <CollapsibleContent className="mt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-1">
                  <Label htmlFor="lot_number" className="text-xs">
                    Lot Number
                  </Label>
                  <Input
                    id="lot_number"
                    placeholder="e.g., B-4501"
                    value={filters.lot_number || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, lot_number: e.target.value }))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lp_search" className="text-xs">
                    LP Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      id="lp_search"
                      placeholder="LP number..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                      className="h-8 pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="expiry_from" className="text-xs">
                    Expiry From
                  </Label>
                  <Input
                    id="expiry_from"
                    type="date"
                    value={filters.expiry_from || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, expiry_from: e.target.value }))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="expiry_to" className="text-xs">
                    Expiry To
                  </Label>
                  <Input
                    id="expiry_to"
                    type="date"
                    value={filters.expiry_to || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, expiry_to: e.target.value }))}
                    className="h-8"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Future Feature Banner */}
          <div className="flex items-center justify-between p-2 border rounded bg-gray-50">
            <Button variant="ghost" size="sm" disabled className="gap-2 text-gray-400">
              Suggest LPs (FIFO)
            </Button>
            <Badge variant="outline" className="text-xs">
              Coming Soon
            </Badge>
          </div>

          {/* Content Area - Loading / Error / Empty / Table */}
          {isLoading ? (
            renderLoadingState()
          ) : error ? (
            renderErrorState()
          ) : availableLPs.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* LP List - Desktop Table / Mobile Cards */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <span className="text-sm font-medium text-gray-700">
                    Available License Plates ({availableLPs.length})
                  </span>
                </div>
                {/* Mobile Card View */}
                {isMobile ? (
                  <div className="max-h-[300px] overflow-auto p-4 space-y-3">
                    {availableLPs.map(renderMobileLPCard)}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div className="max-h-[250px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-12"></TableHead>
                          <TableHead className="text-xs">LP Number</TableHead>
                          <TableHead className="text-xs">Lot</TableHead>
                          <TableHead className="text-xs">Expiry</TableHead>
                          <TableHead className="text-xs">Location</TableHead>
                          <TableHead className="text-xs text-right">Available</TableHead>
                          <TableHead className="text-xs text-right w-28">Assign Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableLPs.map((lp) => {
                          const isSelected = selections.has(lp.id)
                          const selection = selections.get(lp.id)
                          const hasError =
                            isSelected &&
                            selection &&
                            selection.quantity > lp.available_qty

                          return (
                            <TableRow
                              key={lp.id}
                              className={`${isSelected ? 'bg-blue-50' : ''} ${
                                hasError ? 'bg-red-50' : ''
                              }`}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleToggleLP(lp, checked as boolean)
                                  }
                                  aria-label={`Select ${lp.lp_number}`}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {lp.lp_number}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {lp.lot_number || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {formatDate(lp.expiry_date)}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {lp.location || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-right font-medium">
                                {formatNumber(lp.available_qty)} {lp.uom}
                              </TableCell>
                              <TableCell>
                                {isSelected && (
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={lp.available_qty}
                                      step="0.01"
                                      value={selection?.quantity || 0}
                                      onChange={(e) =>
                                        handleQuantityChange(lp.id, e.target.value)
                                      }
                                      className={`h-7 w-24 text-right font-mono text-sm ${
                                        hasError
                                          ? 'border-red-500 focus:ring-red-500'
                                          : ''
                                      }`}
                                      aria-label={`Quantity for ${lp.lp_number}`}
                                    />
                                    {hasError && (
                                      <p className="text-xs text-red-600 mt-1">
                                        Max: {formatNumber(lp.available_qty)}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Selected LPs Summary */}
              <div className="border rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Selected LPs ({selections.size})
                  </span>
                  {selections.size > 0 && (
                    <span className="text-sm text-gray-500">
                      Total: {formatNumber(totalSelected)} {toLine.uom}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {selections.size === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No License Plates selected yet.
                      <br />
                      Check the boxes above and enter quantities to assign LPs.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Array.from(selections.values()).map((sel) => (
                        <Badge
                          key={sel.lp_id}
                          variant="secondary"
                          className="flex items-center gap-2 py-1 px-3"
                        >
                          <span className="font-mono text-xs">{sel.lp_number}</span>
                          <span className="text-xs text-gray-500">|</span>
                          <span className="text-xs">Lot: {sel.lot_number || '-'}</span>
                          <span className="text-xs text-gray-500">|</span>
                          <span className="text-xs">
                            Expiry: {formatDate(sel.expiry_date)}
                          </span>
                          <span className="text-xs text-gray-500">|</span>
                          <span className="text-xs font-medium">
                            {formatNumber(sel.quantity)} {toLine.uom}
                          </span>
                          <button
                            onClick={() => handleRemoveSelection(sel.lp_id)}
                            className="ml-1 hover:text-red-600"
                            aria-label={`Remove ${sel.lp_number}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              selections.size === 0 ||
              isOverAllocated ||
              isLoading ||
              !!error
            }
            className={isUnderAllocated ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isUnderAllocated
              ? `Assign Anyway (${formatNumber(totalSelected)} ${toLine.uom})`
              : `Assign Selected (${formatNumber(totalSelected)} ${toLine.uom})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TOLPPickerModal
