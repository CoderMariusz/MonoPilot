/**
 * Reserve LP Modal Component
 * Story 03.11b: WO Material Reservations (LP Allocation)
 * Modal for selecting and reserving available LPs for a WO material
 * Pattern: ShadCN Dialog with AvailableLPsTable (adapted from PLAN-026 wireframe)
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { formatNumber, formatDate } from '@/lib/utils/format-quantity'
import { AvailableLPsTable, type LPSelection } from './AvailableLPsTable'
import { useAvailableLPsForMaterial, useReserveLPs } from '@/lib/hooks/use-wo-reservations'
import type { AvailableLP } from '@/lib/validation/wo-reservations'

// ============================================================================
// TYPES
// ============================================================================

export interface ReserveLPModalProps {
  isOpen: boolean
  onClose: () => void
  // Context
  woId: string
  woMaterialId: string
  woNumber: string
  // Material info
  productId: string
  productName: string
  productCode: string
  requiredQty: number
  currentlyReservedQty: number
  uom: string
  // Warehouse info
  warehouseId: string
  warehouseName: string
  warehouseCode: string
  // Algorithm (from warehouse settings)
  defaultAlgorithm?: 'fifo' | 'fefo'
  // Callbacks
  onSuccess?: () => void
}

interface LPSelectionState {
  lp_id: string
  lp_number: string
  quantity: number
  lot_number: string | null
  expiry_date: string | null
  location: string | null
  available_qty: number
}

interface Filters {
  lot_number?: string
  location?: string
  search?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReserveLPModal({
  isOpen,
  onClose,
  woId,
  woMaterialId,
  woNumber,
  productId,
  productName,
  productCode,
  requiredQty,
  currentlyReservedQty,
  uom,
  warehouseId,
  warehouseName,
  warehouseCode,
  defaultAlgorithm = 'fifo',
  onSuccess,
}: ReserveLPModalProps) {
  // State
  const [selections, setSelections] = useState<Map<string, LPSelectionState>>(new Map())
  const [sortOrder, setSortOrder] = useState<'fifo' | 'fefo'>(defaultAlgorithm)
  const [filters, setFilters] = useState<Filters>({})
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [acknowledgeOverReservation, setAcknowledgeOverReservation] = useState(false)

  const isMobile = useMediaQuery('(max-width: 768px)')
  const { toast } = useToast()

  // Data fetching
  const {
    data: availableLPsData,
    isLoading,
    error,
    refetch,
  } = useAvailableLPsForMaterial(
    woId,
    woMaterialId,
    { sort: sortOrder, lot_number: filters.lot_number, location: filters.location },
    { enabled: isOpen }
  )

  const reserveMutation = useReserveLPs()

  const availableLPs = availableLPsData?.lps || []

  // Calculations
  const totalSelected = useMemo(() => {
    let sum = 0
    selections.forEach((sel) => (sum += sel.quantity))
    return sum
  }, [selections])

  const totalWithExisting = totalSelected + currentlyReservedQty
  const remainingQty = requiredQty - currentlyReservedQty

  const progressPercent = requiredQty > 0
    ? Math.min(120, Math.round((totalWithExisting / requiredQty) * 100))
    : 0

  const isOverReserved = totalWithExisting > requiredQty
  const isExactMatch = totalWithExisting === requiredQty
  const isUnderReserved = totalWithExisting < requiredQty && totalSelected > 0

  // Convert selections Map to Map<string, number> for AvailableLPsTable
  const selectedLPsMap = useMemo(() => {
    const map = new Map<string, number>()
    selections.forEach((sel, id) => map.set(id, sel.quantity))
    return map
  }, [selections])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelections(new Map())
      setFilters({})
      setAcknowledgeOverReservation(false)
    }
  }, [isOpen])

  // Handlers
  const handleSelectLP = useCallback(
    (lpId: string, selected: boolean, lp: AvailableLP) => {
      const newSelections = new Map(selections)

      if (selected) {
        // Default quantity: min of available qty or remaining needed
        const defaultQty = Math.min(
          lp.available_qty,
          Math.max(0, remainingQty - totalSelected)
        )
        newSelections.set(lpId, {
          lp_id: lpId,
          lp_number: lp.lp_number,
          quantity: defaultQty > 0 ? defaultQty : lp.available_qty,
          lot_number: lp.lot_number || null,
          expiry_date: lp.expiry_date || null,
          location: lp.location || null,
          available_qty: lp.available_qty,
        })
      } else {
        newSelections.delete(lpId)
      }

      setSelections(newSelections)
    },
    [selections, remainingQty, totalSelected]
  )

  const handleQuantityChange = useCallback((lpId: string, quantity: number) => {
    setSelections((prev) => {
      const selection = prev.get(lpId)
      if (!selection) return prev
      const newSelections = new Map(prev)
      newSelections.set(lpId, { ...selection, quantity })
      return newSelections
    })
  }, [])

  const handleRemoveSelection = useCallback((lpId: string) => {
    setSelections((prev) => {
      const newSelections = new Map(prev)
      newSelections.delete(lpId)
      return newSelections
    })
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const handleSubmit = async () => {
    if (selections.size === 0) {
      toast({
        title: 'No LPs Selected',
        description: 'Please select at least one License Plate to reserve.',
        variant: 'destructive',
      })
      return
    }

    // Validate over-reservation acknowledgment
    if (isOverReserved && !acknowledgeOverReservation) {
      toast({
        title: 'Acknowledgment Required',
        description: 'Please acknowledge the over-reservation before proceeding.',
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
          description: `${sel.lp_number} only has ${formatNumber(sel.available_qty)} ${uom} available.`,
          variant: 'destructive',
        })
        return
      }
    }

    try {
      await reserveMutation.mutateAsync({
        woId,
        materialId: woMaterialId,
        reservations: Array.from(selections.values()).map((sel) => ({
          lp_id: sel.lp_id,
          quantity: sel.quantity,
        })),
        acknowledgeOverReservation: isOverReserved,
      })

      toast({
        title: 'Success',
        description: `${selections.size} License Plate${selections.size > 1 ? 's' : ''} reserved successfully`,
      })

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Error reserving LPs:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reserve License Plates',
        variant: 'destructive',
      })
    }
  }

  // Loading state content
  const renderLoadingState = () => (
    <div className="py-12 text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600">Loading available LPs...</p>
      <p className="text-sm text-gray-500">Checking inventory in {warehouseName}</p>
      <div className="mt-4 max-w-sm mx-auto space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )

  // Empty state content
  const renderEmptyState = () => (
    <div className="py-12 text-center">
      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Available License Plates
      </h3>
      <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
        No LPs found for {productName} in {warehouseName} with available quantity.
      </p>
      <div className="text-left max-w-sm mx-auto mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Possible reasons:</p>
        <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
          <li>All LPs are already fully reserved by other Work Orders</li>
          <li>No inventory received for this product</li>
          <li>All LPs are blocked, quarantined, or expired</li>
        </ul>
      </div>
      <Button variant="outline" onClick={handleClearFilters}>
        Clear Filters
      </Button>
    </div>
  )

  // Error state content
  const renderErrorState = () => (
    <div className="py-12 text-center">
      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Failed to Load Available LPs
      </h3>
      <p className="text-sm text-gray-500 mb-2">
        {error instanceof Error ? error.message : 'Unknown error'}
      </p>
      <p className="text-xs text-gray-400 mb-4">Error Code: PLAN-026-LP-LOAD-ERR</p>
      <div className="flex justify-center gap-3">
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Reserve License Plates</DialogTitle>
          <DialogDescription>
            Select License Plates to reserve for {productName} ({productCode})
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-2">
          {/* Material Info Header */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{productName}</p>
                <p className="text-sm text-gray-500">{productCode}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Required Quantity</p>
                <p className="font-medium">
                  {formatNumber(requiredQty)} {uom}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Currently Reserved: {formatNumber(currentlyReservedQty)} {uom}</span>
              <span>Warehouse: {warehouseName} ({warehouseCode})</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div
            className={`p-4 rounded-lg border ${
              isOverReserved
                ? 'bg-yellow-50 border-yellow-200'
                : isExactMatch
                ? 'bg-green-50 border-green-200'
                : isUnderReserved
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Reserving: {formatNumber(totalWithExisting)} / {formatNumber(requiredQty)} {uom}
              </span>
              <span className="text-sm font-medium">{Math.min(progressPercent, 100)}%</span>
            </div>
            <Progress
              value={Math.min(progressPercent, 100)}
              className={`h-2 ${
                isOverReserved
                  ? '[&>div]:bg-yellow-500'
                  : isExactMatch
                  ? '[&>div]:bg-green-500'
                  : isUnderReserved
                  ? '[&>div]:bg-blue-500'
                  : ''
              }`}
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
            {isUnderReserved && (
              <p className="text-sm text-blue-700 mt-2">
                {formatNumber(requiredQty - totalWithExisting)} {uom} remaining to fully reserve
              </p>
            )}
            {isOverReserved && (
              <p className="text-sm text-yellow-700 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Over-reserved by {formatNumber(totalWithExisting - requiredQty)} {uom}
              </p>
            )}
          </div>

          {/* Over-Reservation Warning */}
          {isOverReserved && (
            <Alert variant="default" className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Over-Reservation Warning</strong>
                <p className="mt-1 text-sm">
                  Total reserved ({formatNumber(totalWithExisting)} {uom}) exceeds required
                  quantity ({formatNumber(requiredQty)} {uom}) by{' '}
                  {formatNumber(totalWithExisting - requiredQty)} {uom}.
                </p>
                <p className="mt-1 text-sm">
                  This is allowed (soft reservation) but may reduce availability for other
                  Work Orders. Only the required quantity will be consumed.
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <Checkbox
                    id="acknowledge"
                    checked={acknowledgeOverReservation}
                    onCheckedChange={(checked) =>
                      setAcknowledgeOverReservation(checked as boolean)
                    }
                  />
                  <Label htmlFor="acknowledge" className="text-sm cursor-pointer">
                    I understand, proceed with over-reservation
                  </Label>
                </div>
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
              {(filters.lot_number || filters.location) && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
            <CollapsibleContent className="mt-2">
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-1">
                  <Label htmlFor="lot_number" className="text-xs">
                    Lot Number
                  </Label>
                  <Input
                    id="lot_number"
                    placeholder="e.g., B-4501"
                    value={filters.lot_number || ''}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, lot_number: e.target.value }))
                    }
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="location" className="text-xs">
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., A1-01"
                    value={filters.location || ''}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, location: e.target.value }))
                    }
                    className="h-8"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Content Area */}
          {isLoading ? (
            renderLoadingState()
          ) : error ? (
            renderErrorState()
          ) : availableLPs.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* Available LPs Table */}
              <AvailableLPsTable
                lps={availableLPs}
                selectedLPs={selectedLPsMap}
                sortOrder={sortOrder}
                isLoading={false}
                uom={uom}
                onSelect={handleSelectLP}
                onQuantityChange={handleQuantityChange}
                onSortChange={setSortOrder}
              />

              {/* Selected LPs Summary */}
              <div className="border rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Selected LPs ({selections.size})
                  </span>
                  {selections.size > 0 && (
                    <span className="text-sm text-gray-500">
                      Total: {formatNumber(totalSelected)} {uom}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {selections.size === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No License Plates selected yet.
                      <br />
                      Check the boxes above and enter quantities to reserve LPs.
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
                            {formatNumber(sel.quantity)} {uom}
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
          <Button
            variant="outline"
            onClick={onClose}
            disabled={reserveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              reserveMutation.isPending ||
              selections.size === 0 ||
              (isOverReserved && !acknowledgeOverReservation) ||
              isLoading ||
              !!error
            }
            className={isOverReserved ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            {reserveMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isOverReserved
              ? `Reserve Anyway (${formatNumber(totalSelected)} ${uom})`
              : `Reserve Selected (${formatNumber(totalSelected)} ${uom})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReserveLPModal
