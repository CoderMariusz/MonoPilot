/**
 * Available LPs Table Component
 * Story 03.11b: WO Material Reservations (LP Allocation)
 * Reusable table showing available LPs for selection with FIFO/FEFO sorting
 * Pattern: ShadCN DataTable with checkbox selection (adapted from PLAN-026 wireframe)
 */

'use client'

import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Package, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AvailableLP } from '@/lib/validation/wo-reservations'

// ============================================================================
// TYPES
// ============================================================================

export interface LPSelection {
  lpId: string
  lpNumber: string
  quantity: number
  lotNumber: string | null
  expiryDate: string | null
  location: string | null
  availableQty: number
}

export interface AvailableLPsTableProps {
  lps: AvailableLP[]
  selectedLPs: Map<string, number>
  sortOrder: 'fifo' | 'fefo'
  isLoading: boolean
  uom: string
  onSelect: (lpId: string, selected: boolean, lp: AvailableLP) => void
  onQuantityChange: (lpId: string, quantity: number) => void
  onSortChange: (order: 'fifo' | 'fefo') => void
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatNumber(num: number): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getShelfLife(expiryDate: string | null): { text: string; isNearExpiry: boolean } {
  if (!expiryDate) return { text: '-', isNearExpiry: false }

  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffMs = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return { text: 'Expired', isNearExpiry: true }
  } else if (diffDays <= 30) {
    return { text: `${diffDays} days`, isNearExpiry: true }
  } else if (diffDays <= 90) {
    const months = Math.round(diffDays / 30)
    return { text: `${months} mo`, isNearExpiry: false }
  } else {
    const months = Math.round(diffDays / 30)
    return { text: `${months} mo`, isNearExpiry: false }
  }
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
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

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Available License Plates
      </h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        No LPs available for reservation. All inventory may be reserved by other Work Orders
        or there is no matching inventory in the warehouse.
      </p>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AvailableLPsTable({
  lps,
  selectedLPs,
  sortOrder,
  isLoading,
  uom,
  onSelect,
  onQuantityChange,
  onSortChange,
}: AvailableLPsTableProps) {
  // Sort LPs based on sort order
  const sortedLPs = useMemo(() => {
    const sorted = [...lps]
    if (sortOrder === 'fifo') {
      sorted.sort((a, b) => {
        // Primary: created_at ASC
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        if (dateA !== dateB) return dateA - dateB
        // Secondary: expiry_date ASC
        const expiryA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity
        const expiryB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity
        return expiryA - expiryB
      })
    } else {
      // FEFO
      sorted.sort((a, b) => {
        // Primary: expiry_date ASC (NULL last)
        const expiryA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity
        const expiryB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity
        if (expiryA !== expiryB) return expiryA - expiryB
        // Secondary: created_at ASC
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateA - dateB
      })
    }
    return sorted
  }, [lps, sortOrder])

  // Loading state
  if (isLoading) {
    return <LoadingState />
  }

  // Empty state
  if (lps.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4">
      {/* Sort Order Selection */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Available License Plates ({lps.length})
        </span>
        <RadioGroup
          value={sortOrder}
          onValueChange={(value) => onSortChange(value as 'fifo' | 'fefo')}
          className="flex items-center gap-4"
          aria-label="Sort order"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fifo" id="sort-fifo" />
            <Label htmlFor="sort-fifo" className="text-sm cursor-pointer">
              FIFO (First In, First Out)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fefo" id="sort-fefo" />
            <Label htmlFor="sort-fefo" className="text-sm cursor-pointer">
              FEFO (First Expiry, First Out)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Table */}
      <div className="border rounded-lg max-h-[300px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-gray-50 z-10">
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="text-xs">LP Number</TableHead>
              <TableHead className="text-xs">Lot</TableHead>
              <TableHead className="text-xs">Expiry</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs text-right">Avail Qty</TableHead>
              <TableHead className="text-xs">Shelf Life</TableHead>
              <TableHead className="text-xs text-right w-28">Reserve</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLPs.map((lp) => {
              const isSelected = selectedLPs.has(lp.id)
              const selectedQty = selectedLPs.get(lp.id) || 0
              const hasError = isSelected && selectedQty > lp.available_qty
              const shelfLife = getShelfLife(lp.expiry_date)

              // Check if LP has other reservations
              const hasOtherReservations =
                lp.other_reservations && lp.other_reservations.length > 0
              const otherReservationsTotal =
                lp.other_reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0

              return (
                <TableRow
                  key={lp.id}
                  className={cn(
                    isSelected && 'bg-blue-50',
                    hasError && 'bg-red-50'
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        onSelect(lp.id, checked as boolean, lp)
                      }
                      aria-label={`Select ${lp.lp_number}, ${formatNumber(lp.available_qty)} ${uom} available`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-mono text-sm">{lp.lp_number}</span>
                      {hasOtherReservations && (
                        <p className="text-xs text-yellow-600 mt-0.5">
                          {formatNumber(otherReservationsTotal)} {uom} reserved by other WOs
                        </p>
                      )}
                    </div>
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
                    {formatNumber(lp.available_qty)} {lp.uom || uom}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'text-sm',
                        shelfLife.isNearExpiry && 'text-yellow-600 font-medium'
                      )}
                    >
                      {shelfLife.text}
                      {shelfLife.isNearExpiry && (
                        <AlertTriangle className="inline-block h-3 w-3 ml-1" />
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isSelected && (
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={lp.available_qty}
                          step="0.01"
                          value={selectedQty}
                          onChange={(e) =>
                            onQuantityChange(lp.id, parseFloat(e.target.value) || 0)
                          }
                          className={cn(
                            'h-7 w-24 text-right font-mono text-sm',
                            hasError && 'border-red-500 focus:ring-red-500'
                          )}
                          aria-label={`Reserve quantity for ${lp.lp_number}`}
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
    </div>
  )
}

export default AvailableLPsTable
