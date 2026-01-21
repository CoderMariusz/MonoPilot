/**
 * AvailableLPsPicker Component (Story 04.8)
 * Table for selecting available LPs with FIFO/FEFO sorting
 *
 * Wireframe: PLAN-026 Component 3: AvailableLPsTable
 *
 * Features:
 * - FIFO/FEFO sort toggle
 * - Checkbox selection with quantity input
 * - Progress indicator
 * - Over-reservation warning
 * - Other WO reservation warnings
 * - Near-expiry highlighting
 */

'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Package,
  X,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AvailableLP } from '@/lib/validation/wo-reservations'

export interface AvailableLPsPickerProps {
  /** Available LPs list */
  lps: AvailableLP[]
  /** Currently selected LPs with quantities: Map<lpId, quantity> */
  selectedLPs: Map<string, number>
  /** Current sort order */
  sortOrder: 'fifo' | 'fefo'
  /** Loading state */
  isLoading: boolean
  /** Required quantity for this material */
  requiredQty: number
  /** Already reserved quantity (before this selection) */
  currentlyReservedQty?: number
  /** Unit of measure */
  uom: string
  /** Callback when LP selection changes */
  onSelect: (lpId: string, selected: boolean) => void
  /** Callback when quantity changes for an LP */
  onQuantityChange: (lpId: string, quantity: number) => void
  /** Callback when sort order changes */
  onSortChange: (order: 'fifo' | 'fefo') => void
}

/**
 * Calculate days until expiry
 */
function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Format shelf life for display
 */
function formatShelfLife(expiryDate: string | null): string {
  const days = getDaysUntilExpiry(expiryDate)
  if (days === null) return 'No expiry'
  if (days < 0) return 'Expired'
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  if (days < 30) return `${days} days`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `${months} mo`
  }
  const years = Math.floor(days / 365)
  return `${years}y`
}

/**
 * Format date for display
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Check if LP is near expiry (< 30 days)
 */
function isNearExpiry(expiryDate: string | null): boolean {
  const days = getDaysUntilExpiry(expiryDate)
  return days !== null && days >= 0 && days < 30
}

export function AvailableLPsPicker({
  lps,
  selectedLPs,
  sortOrder,
  isLoading,
  requiredQty,
  currentlyReservedQty = 0,
  uom,
  onSelect,
  onQuantityChange,
  onSortChange,
}: AvailableLPsPickerProps) {
  // Track validation errors per LP
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map())

  // Over-reservation acknowledgment
  const [acknowledgeOver, setAcknowledgeOver] = useState(false)

  // Calculate total selected
  const totalSelected = useMemo(() => {
    let total = 0
    selectedLPs.forEach((qty) => {
      total += qty
    })
    return total
  }, [selectedLPs])

  // Calculate progress
  const progress = useMemo(() => {
    const total = currentlyReservedQty + totalSelected
    if (requiredQty === 0) return 0
    return Math.min(200, Math.round((total / requiredQty) * 100))
  }, [totalSelected, currentlyReservedQty, requiredQty])

  // Check if over-reserved
  const isOverReserved = currentlyReservedQty + totalSelected > requiredQty
  const overAmount = Math.max(0, currentlyReservedQty + totalSelected - requiredQty)
  const remainingToReserve = Math.max(0, requiredQty - currentlyReservedQty - totalSelected)

  // Sort LPs based on sort order
  const sortedLPs = useMemo(() => {
    const sorted = [...lps]
    if (sortOrder === 'fifo') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        if (dateA !== dateB) return dateA - dateB
        // Secondary sort by expiry
        const expiryA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity
        const expiryB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity
        return expiryA - expiryB
      })
    } else {
      // FEFO: sort by expiry date, null/no-expiry last
      sorted.sort((a, b) => {
        const expiryA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity
        const expiryB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity
        if (expiryA !== expiryB) return expiryA - expiryB
        // Secondary sort by created_at
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateA - dateB
      })
    }
    return sorted
  }, [lps, sortOrder])

  // Handle checkbox change
  const handleSelect = useCallback(
    (lpId: string, checked: boolean) => {
      onSelect(lpId, checked)
      if (checked) {
        // When selecting, default to available_qty
        const lp = lps.find((l) => l.id === lpId)
        if (lp) {
          onQuantityChange(lpId, lp.available_qty)
        }
      } else {
        // Clear validation error
        setValidationErrors((prev) => {
          const next = new Map(prev)
          next.delete(lpId)
          return next
        })
      }
    },
    [lps, onSelect, onQuantityChange]
  )

  // Handle quantity change with validation
  const handleQuantityChange = useCallback(
    (lpId: string, value: string) => {
      const lp = lps.find((l) => l.id === lpId)
      if (!lp) return

      const qty = parseFloat(value) || 0

      // Validate
      if (qty > lp.available_qty) {
        setValidationErrors((prev) => {
          const next = new Map(prev)
          next.set(lpId, `Max available: ${lp.available_qty} ${uom}`)
          return next
        })
      } else if (qty < 0) {
        setValidationErrors((prev) => {
          const next = new Map(prev)
          next.set(lpId, 'Quantity cannot be negative')
          return next
        })
      } else {
        setValidationErrors((prev) => {
          const next = new Map(prev)
          next.delete(lpId)
          return next
        })
      }

      onQuantityChange(lpId, qty)
    },
    [lps, uom, onQuantityChange]
  )

  // Remove LP from selection
  const handleRemove = useCallback(
    (lpId: string) => {
      onSelect(lpId, false)
      setValidationErrors((prev) => {
        const next = new Map(prev)
        next.delete(lpId)
        return next
      })
    },
    [onSelect]
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="available-lps-picker-loading">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
        <p className="text-center text-muted-foreground">Loading available LPs...</p>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(8)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Empty state
  if (lps.length === 0) {
    return (
      <div
        className="text-center py-12 border rounded-lg bg-muted/50"
        data-testid="available-lps-picker-empty"
      >
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="font-semibold mb-2">No Available License Plates</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
          No LPs found with available quantity.
        </p>
        <div className="text-sm text-muted-foreground space-y-1" data-testid="empty-reasons">
          <p>Possible reasons:</p>
          <ul className="list-disc list-inside">
            <li>All LPs are already fully reserved by other Work Orders</li>
            <li>No inventory received for this product</li>
            <li>All LPs are blocked, quarantined, or expired</li>
          </ul>
        </div>
        <Button variant="outline" className="mt-4" asChild>
          <a href="/warehouse/inventory">View All Inventory</a>
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4" data-testid="available-lps-picker">
        {/* Progress Indicator */}
        <div
          className={cn(
            'p-4 border rounded-lg',
            isOverReserved ? 'border-yellow-300 bg-yellow-50' : 'bg-muted/50'
          )}
          data-testid="progress-indicator"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Reserving: {(currentlyReservedQty + totalSelected).toFixed(1)} / {requiredQty} {uom}
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                progress >= 100 ? (isOverReserved ? 'text-yellow-600' : 'text-green-600') : ''
              )}
            >
              {progress}%
            </span>
          </div>
          <Progress
            value={Math.min(100, progress)}
            className={cn(
              'h-2',
              isOverReserved && '[&>div]:bg-yellow-500'
            )}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
          {!isOverReserved && remainingToReserve > 0 && (
            <p className="text-sm text-muted-foreground mt-1" data-testid="remaining-message">
              {remainingToReserve.toFixed(1)} {uom} remaining to fully reserve
            </p>
          )}
        </div>

        {/* Over-Reservation Warning */}
        {isOverReserved && (
          <Alert variant="default" className="border-yellow-300 bg-yellow-50" data-testid="over-reservation-warning">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Over-Reservation Warning</AlertTitle>
            <AlertDescription className="text-yellow-700">
              <p className="mb-2">
                Total reserved ({(currentlyReservedQty + totalSelected).toFixed(1)} {uom}) exceeds
                required quantity ({requiredQty} {uom}) by {overAmount.toFixed(1)} {uom}.
              </p>
              <p className="text-sm mb-3">
                This is allowed (soft reservation) but may reduce availability for other Work Orders.
                Only the required quantity will be consumed.
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acknowledge-over"
                  checked={acknowledgeOver}
                  onCheckedChange={(checked) => setAcknowledgeOver(checked === true)}
                  data-testid="acknowledge-checkbox"
                />
                <Label htmlFor="acknowledge-over" className="text-sm">
                  I understand, proceed with over-reservation
                </Label>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Sort Order */}
        <div className="flex items-center gap-4 p-3 border rounded-lg bg-background" data-testid="sort-order">
          <span className="text-sm font-medium">Sort by:</span>
          <RadioGroup
            value={sortOrder}
            onValueChange={(value) => onSortChange(value as 'fifo' | 'fefo')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fifo" id="fifo" data-testid="fifo-radio" />
              <Label htmlFor="fifo" className="text-sm cursor-pointer">
                FIFO (First In, First Out)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fefo" id="fefo" data-testid="fefo-radio" />
              <Label htmlFor="fefo" className="text-sm cursor-pointer">
                FEFO (First Expiry, First Out)
              </Label>
            </div>
          </RadioGroup>
        </div>
        <p className="text-xs text-muted-foreground" data-testid="sort-description">
          {sortOrder === 'fifo'
            ? 'LPs are sorted by receipt date to prioritize older stock'
            : 'LPs are sorted by expiry date to prioritize items expiring first'}
        </p>

        {/* Available LPs Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <span className="sr-only">Select</span>
                </TableHead>
                <TableHead>LP Number</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Avail Qty</TableHead>
                <TableHead>Shelf Life</TableHead>
                <TableHead className="w-24">Reserve</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLPs.map((lp, index) => {
                const isSelected = selectedLPs.has(lp.id)
                const selectedQty = selectedLPs.get(lp.id) || 0
                const nearExpiry = isNearExpiry(lp.expiry_date)
                const hasOtherReservations = lp.other_reservations && lp.other_reservations.length > 0
                const validationError = validationErrors.get(lp.id)
                const isSuggested = index === 0 // First item is suggested

                return (
                  <TableRow
                    key={lp.id}
                    className={cn(
                      isSelected && 'bg-blue-50',
                      nearExpiry && !isSelected && 'bg-yellow-50'
                    )}
                    data-testid={`lp-row-${lp.id}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelect(lp.id, checked === true)}
                        aria-label={`Select ${lp.lp_number} for reservation`}
                        data-testid={`checkbox-${lp.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          {lp.lp_number}
                          {isSuggested && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              {sortOrder === 'fifo' ? 'Oldest' : 'First Expiry'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Received: {formatDate(lp.created_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {lp.lot_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className={cn('text-sm', nearExpiry && 'text-yellow-600 font-medium')}>
                        {lp.expiry_date ? formatDate(lp.expiry_date) : 'No expiry'}
                        {nearExpiry && (
                          <AlertTriangle
                            className="inline-block ml-1 h-4 w-4 text-yellow-500"
                            data-testid="near-expiry-warning"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {lp.location || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <span className="font-mono">
                          {lp.available_qty} {lp.uom || uom}
                        </span>
                        {hasOtherReservations && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="text-xs text-amber-600 flex items-center justify-end gap-1"
                                data-testid="other-reservations-warning"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                <span>Partially reserved</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <div className="space-y-1">
                                <p className="font-medium">Reserved by other WOs:</p>
                                {lp.other_reservations?.map((res, i) => (
                                  <p key={i} className="text-sm">
                                    {res.wo_number}: {res.quantity} {lp.uom || uom}
                                  </p>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'text-sm',
                          nearExpiry && 'text-yellow-600 font-medium'
                        )}
                      >
                        {formatShelfLife(lp.expiry_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          min={0}
                          max={lp.available_qty}
                          step="0.01"
                          value={isSelected ? selectedQty : ''}
                          onChange={(e) => handleQuantityChange(lp.id, e.target.value)}
                          disabled={!isSelected}
                          className={cn(
                            'w-20 h-8 text-sm',
                            validationError && 'border-red-500'
                          )}
                          aria-label={`Reserve quantity for ${lp.lp_number}`}
                          data-testid={`qty-input-${lp.id}`}
                        />
                        {validationError && (
                          <p className="text-xs text-red-500" data-testid="validation-error">
                            {validationError}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Selected LPs Summary */}
        <div className="border rounded-lg p-4" data-testid="selected-summary">
          <h4 className="font-medium mb-3">
            Selected LPs ({selectedLPs.size})
          </h4>
          {selectedLPs.size === 0 ? (
            <p className="text-sm text-muted-foreground">
              No License Plates selected yet.
              <br />
              Check the boxes above and enter quantities to reserve LPs.
            </p>
          ) : (
            <div className="space-y-2">
              {Array.from(selectedLPs.entries()).map(([lpId, qty]) => {
                const lp = lps.find((l) => l.id === lpId)
                if (!lp) return null
                return (
                  <div
                    key={lpId}
                    className="flex items-center justify-between bg-muted/50 rounded-md p-2"
                    data-testid={`selected-${lpId}`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{lp.lp_number}</span>
                      {lp.lot_number && (
                        <>
                          <span className="text-muted-foreground">|</span>
                          <span className="text-muted-foreground">
                            Lot: {lp.lot_number}
                          </span>
                        </>
                      )}
                      {lp.expiry_date && (
                        <>
                          <span className="text-muted-foreground">|</span>
                          <span className="text-muted-foreground">
                            Expiry: {formatDate(lp.expiry_date)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {qty} {lp.uom || uom}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(lpId)}
                        className="h-6 w-6 p-0"
                        aria-label={`Remove ${lp.lp_number} from selection`}
                        data-testid={`remove-${lpId}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total Selected:</span>
                <span className="font-mono font-medium">
                  {totalSelected.toFixed(2)} {uom}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default AvailableLPsPicker
