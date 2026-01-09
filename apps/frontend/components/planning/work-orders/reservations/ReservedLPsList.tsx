/**
 * Reserved LPs List Component
 * Story 03.11b: WO Material Reservations (LP Allocation)
 * Expandable list showing reserved LPs per WO material with release action
 * Pattern: ShadCN DataTable with expandable rows (adapted from PLAN-026 wireframe)
 */

'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Package,
  AlertTriangle,
  RefreshCw,
  Plus,
  Eye,
  Unlock,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber, formatDate, formatDateTime } from '@/lib/utils/format-quantity'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

// ============================================================================
// TYPES
// ============================================================================

export interface WOMaterialReservation {
  id: string
  lpId: string
  lpNumber: string
  lotNumber: string | null
  expiryDate: string | null
  location: string | null
  reservedQty: number
  consumedQty: number
  status: 'active' | 'released' | 'consumed'
  reservedAt: string
  reservedBy: {
    id: string
    name: string
  }
}

export interface ReservedLPsListProps {
  woMaterialId: string
  materialName: string
  productCode: string
  requiredQty: number
  reservedQty: number
  consumedQty: number
  uom: string
  reservations: WOMaterialReservation[]
  isLoading: boolean
  error?: string
  canModify: boolean
  onReserveMore: () => void
  onRelease: (reservationId: string) => Promise<void>
  onViewLP: (lpId: string) => void
  onRetry: () => void
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function ReservationStatusBadgeInline({
  status,
}: {
  status: 'active' | 'released' | 'consumed'
}) {
  const config = {
    active: { label: 'Active', bg: 'bg-green-100', text: 'text-green-800' },
    released: { label: 'Released', bg: 'bg-gray-100', text: 'text-gray-800' },
    consumed: { label: 'Consumed', bg: 'bg-blue-100', text: 'text-blue-800' },
  }

  const { label, bg, text } = config[status]

  return (
    <Badge
      variant="secondary"
      className={cn(bg, text, 'font-medium border-0 text-xs')}
    >
      {label}
    </Badge>
  )
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-gray-600">Loading reserved LPs...</span>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({
  canModify,
  onReserveMore,
}: {
  canModify: boolean
  onReserveMore: () => void
}) {
  return (
    <div className="py-8 text-center">
      <Package className="h-10 w-10 mx-auto mb-3 text-gray-400" />
      <h3 className="text-sm font-medium text-gray-900 mb-1">
        No LPs Reserved for This Material
      </h3>
      <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
        This material does not have any reserved License Plates yet.
        Reserve LPs to ensure inventory is allocated for this Work Order.
      </p>
      {canModify && (
        <Button onClick={onReserveMore} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Reserve LPs
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({
  error,
  onRetry,
}: {
  error: string
  onRetry: () => void
}) {
  return (
    <div className="py-8 text-center">
      <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-red-500" />
      <h3 className="text-sm font-medium text-gray-900 mb-1">
        Failed to Load Reservations
      </h3>
      <p className="text-sm text-gray-500 mb-2">{error}</p>
      <p className="text-xs text-gray-400 mb-4">Error Code: PLAN-026-RES-LOAD-ERR</p>
      <div className="flex justify-center gap-2">
        <Button onClick={onRetry} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// MOBILE CARD VIEW
// ============================================================================

function MobileReservationCard({
  reservation,
  uom,
  canModify,
  onRelease,
  onViewLP,
  isReleasing,
}: {
  reservation: WOMaterialReservation
  uom: string
  canModify: boolean
  onRelease: () => void
  onViewLP: () => void
  isReleasing: boolean
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono font-medium">{reservation.lpNumber}</span>
          <ReservationStatusBadgeInline status={reservation.status} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Lot: </span>
            <span>{reservation.lotNumber || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Expiry: </span>
            <span>{formatDate(reservation.expiryDate)}</span>
          </div>
          <div>
            <span className="text-gray-500">Location: </span>
            <span>{reservation.location || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Reserved: </span>
            <span className="font-medium">
              {formatNumber(reservation.reservedQty)} {uom}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Consumed: </span>
            <span>
              {formatNumber(reservation.consumedQty)} {uom}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Reserved by {reservation.reservedBy.name} on{' '}
          {formatDateTime(reservation.reservedAt)}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          {canModify && reservation.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRelease}
              disabled={isReleasing}
              className="flex-1"
            >
              {isReleasing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Release
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onViewLP} className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            View LP
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReservedLPsList({
  woMaterialId,
  materialName,
  productCode,
  requiredQty,
  reservedQty,
  consumedQty,
  uom,
  reservations,
  isLoading,
  error,
  canModify,
  onReserveMore,
  onRelease,
  onViewLP,
  onRetry,
}: ReservedLPsListProps) {
  const [releasingId, setReleasingId] = useState<string | null>(null)
  const [confirmReleaseId, setConfirmReleaseId] = useState<string | null>(null)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const remainingQty = reservedQty - consumedQty

  const handleRelease = async (reservationId: string) => {
    try {
      setReleasingId(reservationId)
      await onRelease(reservationId)
      setConfirmReleaseId(null)
    } finally {
      setReleasingId(null)
    }
  }

  const reservationToRelease = reservations.find((r) => r.id === confirmReleaseId)

  // Loading state
  if (isLoading) {
    return (
      <div className="border rounded-lg bg-white">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-medium">
            Reserved License Plates
          </span>
        </div>
        <LoadingState />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="border rounded-lg bg-white">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-medium">Reserved License Plates</span>
        </div>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    )
  }

  // Empty state
  if (reservations.length === 0) {
    return (
      <div className="border rounded-lg bg-white">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-medium">Reserved License Plates (0)</span>
          {canModify && (
            <Button variant="outline" size="sm" onClick={onReserveMore}>
              <Plus className="h-4 w-4 mr-2" />
              Reserve LPs
            </Button>
          )}
        </div>
        <EmptyState canModify={canModify} onReserveMore={onReserveMore} />
      </div>
    )
  }

  // Success state
  return (
    <>
      <div className="border rounded-lg bg-white">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-medium">
            Reserved License Plates ({reservations.length})
          </span>
          {canModify && (
            <Button variant="outline" size="sm" onClick={onReserveMore}>
              <Plus className="h-4 w-4 mr-2" />
              Reserve More
            </Button>
          )}
        </div>

        {/* Mobile Card View */}
        {isMobile ? (
          <div className="p-4 space-y-3">
            {reservations.map((reservation) => (
              <MobileReservationCard
                key={reservation.id}
                reservation={reservation}
                uom={uom}
                canModify={canModify}
                onRelease={() => setConfirmReleaseId(reservation.id)}
                onViewLP={() => onViewLP(reservation.lpId)}
                isReleasing={releasingId === reservation.id}
              />
            ))}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="max-h-[300px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 z-10">
                <TableRow>
                  <TableHead className="text-xs">LP Number</TableHead>
                  <TableHead className="text-xs">Lot</TableHead>
                  <TableHead className="text-xs">Expiry</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs text-right">Reserved</TableHead>
                  <TableHead className="text-xs text-right">Consumed</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div>
                        <span className="font-mono text-sm">
                          {reservation.lpNumber}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Reserved by {reservation.reservedBy.name} on{' '}
                          {formatDateTime(reservation.reservedAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {reservation.lotNumber || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(reservation.expiryDate)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {reservation.location || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-right font-medium">
                      {formatNumber(reservation.reservedQty)} {uom}
                    </TableCell>
                    <TableCell className="text-sm text-right">
                      {formatNumber(reservation.consumedQty)} {uom}
                    </TableCell>
                    <TableCell>
                      <ReservationStatusBadgeInline status={reservation.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {canModify && reservation.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmReleaseId(reservation.id)}
                            disabled={releasingId === reservation.id}
                            aria-label={`Release reservation for ${reservation.lpNumber}`}
                            title="Release reservation"
                          >
                            {releasingId === reservation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewLP(reservation.lpId)}
                          aria-label={`View LP ${reservation.lpNumber}`}
                          title="View LP details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Footer */}
        <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-600">
          Total Reserved: {formatNumber(reservedQty)} {uom} | Total Consumed:{' '}
          {formatNumber(consumedQty)} {uom} | Remaining: {formatNumber(remainingQty)}{' '}
          {uom}
        </div>
      </div>

      {/* Release Confirmation Dialog */}
      <AlertDialog
        open={!!confirmReleaseId}
        onOpenChange={(open) => !open && setConfirmReleaseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to release the reservation for{' '}
              <strong>{reservationToRelease?.lpNumber}</strong>?
              <br />
              <br />
              This will release{' '}
              <strong>
                {reservationToRelease
                  ? formatNumber(reservationToRelease.reservedQty)
                  : 0}{' '}
                {uom}
              </strong>{' '}
              and make this LP available for other Work Orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!releasingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmReleaseId && handleRelease(confirmReleaseId)}
              disabled={!!releasingId}
            >
              {releasingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Releasing...
                </>
              ) : (
                'Release Reservation'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ReservedLPsList
