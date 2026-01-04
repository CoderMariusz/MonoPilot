/**
 * Reservations Panel Component
 * Story: 05.3 - LP Reservations + FIFO/FEFO Picking
 * Wireframe: WH-RES-003
 *
 * Panel on WO detail page showing all material reservations for this work order,
 * with actions to release or add reservations.
 *
 * States:
 * - Loading: Fetching reservations
 * - Empty: No reservations exist
 * - Error: Failed to load reservations
 * - Success: Reservations loaded
 */

'use client'

import { useState, useMemo } from 'react'
import { AlertCircle, XCircle, Package, Plus, MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useWOReservations, type LPReservationWithLP } from '@/lib/hooks/use-lp-reservations'

// ============================================================================
// TYPES
// ============================================================================

interface ReservationsPanelProps {
  woId: string
  woNumber: string
  woStatus: string
  onReservationsChange?: () => void
  onAddReservation?: () => void
  onReleaseReservation?: (reservationId: string) => void
}

type ReservationStatus = 'active' | 'consumed' | 'released' | 'partial'

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No Expiry'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusBadge(reservation: LPReservationWithLP): {
  status: ReservationStatus
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
} {
  if (reservation.status === 'released') {
    return {
      status: 'released',
      label: 'Released',
      variant: 'secondary',
      className: 'bg-orange-100 text-orange-800',
    }
  }

  if (reservation.status === 'consumed' || reservation.remaining_qty === 0) {
    return {
      status: 'consumed',
      label: 'Consumed',
      variant: 'secondary',
      className: 'bg-gray-100 text-gray-800',
    }
  }

  if (reservation.consumed_qty > 0 && reservation.remaining_qty > 0) {
    return {
      status: 'partial',
      label: 'Partial',
      variant: 'default',
      className: 'bg-blue-100 text-blue-800',
    }
  }

  return {
    status: 'active',
    label: 'Active',
    variant: 'default',
    className: 'bg-green-100 text-green-800',
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingState() {
  return (
    <div className="space-y-4" aria-label="Loading reservations">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading reservations...</p>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

function EmptyState({ onAddReservation }: { onAddReservation?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-12">
      <Package className="h-16 w-16 text-muted-foreground" />
      <h3 className="text-lg font-semibold">No Material Reservations</h3>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        No license plates have been reserved for this work order.
      </p>
      <p className="text-sm text-muted-foreground">
        Reserve materials now to ensure availability before production starts.
      </p>
      {onAddReservation && (
        <Button onClick={onAddReservation} className="mt-2">
          <Plus className="mr-2 h-4 w-4" />
          Reserve Materials
        </Button>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        ℹ️ Tip: Use FIFO/FEFO picking to select optimal license plates.
      </p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/5 p-12">
      <XCircle className="h-16 w-16 text-destructive" />
      <h3 className="text-lg font-semibold text-destructive">Failed to Load Reservations</h3>
      <p className="max-w-md text-center text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">
        Please try again. If the problem persists, contact support with error code: WH-RES-003-LOAD-ERR
      </p>
      <Button variant="outline" onClick={onRetry} className="mt-2">
        Try Again
      </Button>
    </div>
  )
}

function SummaryBar({
  totalReserved,
  totalConsumed,
  totalRemaining,
  uom,
}: {
  totalReserved: number
  totalConsumed: number
  totalRemaining: number
  uom: string
}) {
  return (
    <div className="flex gap-6 rounded-lg border bg-gray-50 p-4 text-sm dark:bg-gray-900">
      <div>
        <span className="text-muted-foreground">Total Reserved:</span>{' '}
        <span className="font-semibold tabular-nums">
          {totalReserved.toFixed(2)} {uom}
        </span>
      </div>
      <div className="border-l pl-6">
        <span className="text-muted-foreground">Consumed:</span>{' '}
        <span className="font-semibold tabular-nums">
          {totalConsumed.toFixed(2)} {uom}
        </span>
      </div>
      <div className="border-l pl-6">
        <span className="text-muted-foreground">Remaining:</span>{' '}
        <span className="font-semibold tabular-nums">
          {totalRemaining.toFixed(2)} {uom}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReservationsPanel({
  woId,
  woNumber,
  woStatus,
  onReservationsChange,
  onAddReservation,
  onReleaseReservation,
}: ReservationsPanelProps) {
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [materialFilter, setMaterialFilter] = useState<string>('all')

  // Fetch reservations
  const { data: reservations = [], isLoading, error, refetch } = useWOReservations(woId)

  // Can add/release based on WO status
  const canModify = !['completed', 'cancelled'].includes(woStatus.toLowerCase())

  // Calculate totals
  const totals = useMemo(() => {
    if (reservations.length === 0) {
      return { reserved: 0, consumed: 0, remaining: 0, uom: 'kg' }
    }

    const firstUom = reservations[0]?.lp?.product_name || 'kg'

    return reservations.reduce(
      (acc, res) => ({
        reserved: acc.reserved + res.reserved_qty,
        consumed: acc.consumed + res.consumed_qty,
        remaining: acc.remaining + res.remaining_qty,
        uom: firstUom,
      }),
      { reserved: 0, consumed: 0, remaining: 0, uom: firstUom }
    )
  }, [reservations])

  // Get unique materials for filter
  const uniqueMaterials = useMemo(() => {
    const materials = new Set(reservations.map((r) => r.lp.product_name))
    return Array.from(materials)
  }, [reservations])

  // Filter reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      // Search filter
      if (searchFilter) {
        const search = searchFilter.toLowerCase()
        if (
          !res.lp.lp_number.toLowerCase().includes(search) &&
          !res.lp.batch_number?.toLowerCase().includes(search) &&
          !res.lp.product_name.toLowerCase().includes(search)
        ) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const badge = getStatusBadge(res)
        if (badge.status !== statusFilter) {
          return false
        }
      }

      // Material filter
      if (materialFilter !== 'all' && res.lp.product_name !== materialFilter) {
        return false
      }

      return true
    })
  }, [reservations, searchFilter, statusFilter, materialFilter])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Material Reservations
          {!isLoading && ` (${reservations.length})`}
        </h2>
        {canModify && onAddReservation && !isLoading && (
          <Button onClick={onAddReservation} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Reserve Materials
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.message || 'Unable to fetch reservations'} onRetry={() => refetch()} />
      ) : reservations.length === 0 ? (
        <EmptyState onAddReservation={canModify ? onAddReservation : undefined} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by LP number, batch, or material..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="consumed">Consumed</SelectItem>
                <SelectItem value="released">Released</SelectItem>
              </SelectContent>
            </Select>
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                {uniqueMaterials.map((material) => (
                  <SelectItem key={material} value={material}>
                    {material}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 dark:bg-gray-900">
                  <tr className="text-left">
                    <th className="p-3">Material</th>
                    <th className="p-3">LP Number</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3 text-right">Reserved</th>
                    <th className="p-3 text-right">Consumed</th>
                    <th className="p-3 text-right">Remaining</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((res) => {
                    const badge = getStatusBadge(res)
                    const canRelease = badge.status === 'active' && canModify

                    return (
                      <tr key={res.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{res.lp.product_name}</p>
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {res.lp.location_path}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-mono">{res.lp.lp_number}</p>
                            {res.lp.expiry_date && (
                              <p className="text-xs text-muted-foreground">{formatDate(res.lp.expiry_date)}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{res.lp.batch_number || '-'}</td>
                        <td className="p-3 text-right tabular-nums">{res.reserved_qty.toFixed(2)}</td>
                        <td className="p-3 text-right tabular-nums">{res.consumed_qty.toFixed(2)}</td>
                        <td className="p-3 text-right tabular-nums">{res.remaining_qty.toFixed(2)}</td>
                        <td className="p-3">
                          <Badge variant={badge.variant} className={badge.className}>
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {canRelease && onReleaseReservation && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onReleaseReservation(res.id)}
                              className="text-xs"
                            >
                              Release
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <SummaryBar
            totalReserved={totals.reserved}
            totalConsumed={totals.consumed}
            totalRemaining={totals.remaining}
            uom={totals.uom}
          />

          {/* Info Note */}
          <p className="text-xs text-muted-foreground">
            ℹ️ Consumed quantities update automatically when materials are issued.
          </p>
        </>
      )}
    </div>
  )
}
