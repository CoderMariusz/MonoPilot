/**
 * WOReservationsPanel Component (Story 04.8)
 * Panel on WO detail page showing all material reservations
 *
 * Wireframe: WH-RES-003, PLAN-026 Component 1: ReservedLPsList
 *
 * Features:
 * - Material list with reservation status badges
 * - Expandable rows showing reserved LPs
 * - Reserve/Release actions
 * - Summary totals
 * - All 4 states: loading, empty, error, success
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReservationStatusBadge, getCoverageStatus } from './ReservationStatusBadge'
import { ReserveModal, type LPSelection } from './ReserveModal'
import { useReserveLPs, useReleaseReservation } from '@/lib/hooks/use-wo-reservations'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

interface WOMaterialReservation {
  id: string
  lp_id: string
  lp_number: string
  lot_number: string | null
  expiry_date: string | null
  location: string | null
  reserved_qty: number
  consumed_qty: number
  status: 'active' | 'released' | 'consumed'
  reserved_at: string
  reserved_by: {
    id: string
    name: string
  }
}

interface WOMaterial {
  id: string
  product_id: string
  product_name: string
  product_code: string
  required_qty: number
  reserved_qty: number
  consumed_qty: number
  uom: string
  reservations: WOMaterialReservation[]
}

export interface WOReservationsPanelProps {
  /** Work order ID */
  woId: string
  /** Work order number */
  woNumber: string
  /** Work order status */
  woStatus: string
  /** Materials with reservations */
  materials: WOMaterial[]
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Warehouse ID for reserve modal */
  warehouseId?: string
  /** Warehouse name for display */
  warehouseName?: string
  /** Callback when reservations change */
  onReservationsChange?: () => void
  /** Callback for retry on error */
  onRetry?: () => void
}

// ============================================================================
// Helper Functions
// ============================================================================

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
 * Format date with time
 */
function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Check if WO status allows modifications
 */
function canModifyReservations(status: string): boolean {
  return ['planned', 'released', 'in_progress'].includes(status)
}

/**
 * Get status badge variant
 */
function getReservationStatusBadge(status: 'active' | 'released' | 'consumed'): {
  variant: 'default' | 'secondary' | 'outline'
  label: string
} {
  switch (status) {
    case 'active':
      return { variant: 'default', label: 'Active' }
    case 'consumed':
      return { variant: 'secondary', label: 'Consumed' }
    case 'released':
      return { variant: 'outline', label: 'Released' }
    default:
      return { variant: 'outline', label: status }
  }
}

// ============================================================================
// Component
// ============================================================================

export function WOReservationsPanel({
  woId,
  woNumber,
  woStatus,
  materials,
  isLoading = false,
  error = null,
  warehouseId = '',
  warehouseName = '',
  onReservationsChange,
  onRetry,
}: WOReservationsPanelProps) {
  // Expansion state for materials
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set())

  // Reserve modal state
  const [reserveModalOpen, setReserveModalOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<WOMaterial | null>(null)

  // Mutations
  const reserveLPsMutation = useReserveLPs()
  const releaseReservationMutation = useReleaseReservation()

  const canModify = canModifyReservations(woStatus)

  // Toggle material expansion
  const toggleExpanded = useCallback((materialId: string) => {
    setExpandedMaterials((prev) => {
      const next = new Set(prev)
      if (next.has(materialId)) {
        next.delete(materialId)
      } else {
        next.add(materialId)
      }
      return next
    })
  }, [])

  // Open reserve modal for a material
  const handleOpenReserveModal = useCallback((material: WOMaterial) => {
    setSelectedMaterial(material)
    setReserveModalOpen(true)
  }, [])

  // Close reserve modal
  const handleCloseReserveModal = useCallback(() => {
    setReserveModalOpen(false)
    setSelectedMaterial(null)
  }, [])

  // Handle reserve submission
  const handleReserve = useCallback(
    async (selections: LPSelection[], acknowledgeOver: boolean) => {
      if (!selectedMaterial) return

      await reserveLPsMutation.mutateAsync({
        woId,
        materialId: selectedMaterial.id,
        reservations: selections.map((s) => ({
          lp_id: s.lpId,
          quantity: s.quantity,
        })),
        acknowledgeOverReservation: acknowledgeOver,
      })

      toast.success(`${selections.length} LP(s) reserved successfully`)
      handleCloseReserveModal()
      onReservationsChange?.()
    },
    [woId, selectedMaterial, reserveLPsMutation, handleCloseReserveModal, onReservationsChange]
  )

  // Handle release reservation
  const handleRelease = useCallback(
    async (materialId: string, reservationId: string, lpNumber: string) => {
      try {
        await releaseReservationMutation.mutateAsync({
          woId,
          materialId,
          reservationId,
        })
        toast.success(`Released reservation for ${lpNumber}`)
        onReservationsChange?.()
      } catch (err) {
        toast.error(`Failed to release reservation: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    },
    [woId, releaseReservationMutation, onReservationsChange]
  )

  // Calculate summary totals
  const summary = useMemo(() => {
    let totalReserved = 0
    let totalConsumed = 0
    let totalRemaining = 0

    materials.forEach((m) => {
      totalReserved += m.reserved_qty
      totalConsumed += m.consumed_qty
      totalRemaining += Math.max(0, m.reserved_qty - m.consumed_qty)
    })

    return { totalReserved, totalConsumed, totalRemaining }
  }, [materials])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="reservations-panel-loading">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
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
              {[...Array(5)].map((_, i) => (
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

  // Error state
  if (error) {
    return (
      <div
        className="text-center py-12 border rounded-lg bg-destructive/5"
        data-testid="reservations-panel-error"
      >
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h3 className="font-semibold mb-2 text-destructive">Failed to Load Reservations</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <p className="text-xs text-muted-foreground mb-4">
          Error Code: WH-RES-003-LOAD-ERR
        </p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  // Empty state (no materials)
  if (materials.length === 0) {
    return (
      <div
        className="text-center py-12 border rounded-lg bg-muted/50"
        data-testid="reservations-panel-empty"
      >
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="font-semibold mb-2">No Material Reservations</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
          No license plates have been reserved for this work order.
          Reserve materials now to ensure availability before production starts.
        </p>
        {canModify && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Reserve Materials
          </Button>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Tip: Use FIFO/FEFO picking to select optimal license plates.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4" data-testid="reservations-panel">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Material Reservations ({materials.length})
          </h3>
          {canModify && (
            <Button onClick={() => setReserveModalOpen(true)} disabled={!materials.length}>
              <Plus className="h-4 w-4 mr-2" />
              Reserve Materials
            </Button>
          )}
        </div>

        {/* Materials Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Required</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Consumed</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => {
                const isExpanded = expandedMaterials.has(material.id)
                const remaining = material.reserved_qty - material.consumed_qty
                const hasReservations = material.reservations.length > 0
                const isFullyReserved = material.reserved_qty >= material.required_qty

                return (
                  <Collapsible key={material.id} open={isExpanded} asChild>
                    <>
                      {/* Material Row */}
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => hasReservations && toggleExpanded(material.id)}
                        data-testid={`material-row-${material.id}`}
                      >
                        <TableCell>
                          {hasReservations && (
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{material.product_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {material.product_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {material.required_qty} {material.uom}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <div className="space-y-0.5">
                            <span>{material.reserved_qty} {material.uom}</span>
                            {hasReservations && (
                              <span className="block text-xs text-muted-foreground">
                                {material.reservations.length} LPs
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {material.consumed_qty} {material.uom}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {remaining > 0 ? (
                            <span>{remaining} {material.uom}</span>
                          ) : remaining < 0 ? (
                            <span className="text-yellow-600">
                              {Math.abs(remaining)} {material.uom} over
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0 {material.uom}</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <ReservationStatusBadge
                            requiredQty={material.required_qty}
                            reservedQty={material.reserved_qty}
                            uom={material.uom}
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {canModify && !isFullyReserved && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenReserveModal(material)}
                                    data-testid={`reserve-btn-${material.id}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reserve LPs</TooltipContent>
                              </Tooltip>
                            )}
                            {canModify && isFullyReserved && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    data-testid={`reserve-btn-${material.id}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Fully reserved</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Reservations */}
                      <CollapsibleContent asChild>
                        <TableRow data-testid={`expanded-${material.id}`}>
                          <TableCell colSpan={8} className="bg-muted/30 p-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">
                                  Reserved License Plates ({material.reservations.length})
                                </h4>
                                {canModify && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenReserveModal(material)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Reserve More
                                  </Button>
                                )}
                              </div>

                              {material.reservations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p>No LPs Reserved for This Material</p>
                                  <p className="text-sm">
                                    Reserve LPs to ensure inventory is allocated for this Work Order.
                                  </p>
                                  {canModify && (
                                    <Button
                                      variant="outline"
                                      className="mt-4"
                                      onClick={() => handleOpenReserveModal(material)}
                                    >
                                      Reserve LPs
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>LP Number</TableHead>
                                      <TableHead>Lot</TableHead>
                                      <TableHead>Expiry</TableHead>
                                      <TableHead>Location</TableHead>
                                      <TableHead className="text-right">Reserved</TableHead>
                                      <TableHead className="text-right">Consumed</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="w-20">Action</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {material.reservations.map((res) => {
                                      const badge = getReservationStatusBadge(res.status)
                                      const lpRemaining = res.reserved_qty - res.consumed_qty

                                      return (
                                        <TableRow key={res.id} data-testid={`reservation-${res.id}`}>
                                          <TableCell>
                                            <div className="space-y-1">
                                              <span className="font-medium">{res.lp_number}</span>
                                              <div className="text-xs text-muted-foreground">
                                                Reserved by: {res.reserved_by.name}
                                                <br />
                                                on {formatDateTime(res.reserved_at)}
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell className="font-mono text-sm">
                                            {res.lot_number || 'N/A'}
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                              <Calendar className="h-3 w-3 text-muted-foreground" />
                                              {res.expiry_date
                                                ? formatDate(res.expiry_date)
                                                : 'No expiry'}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                              <MapPin className="h-3 w-3 text-muted-foreground" />
                                              {res.location || 'N/A'}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right font-mono">
                                            {res.reserved_qty} {material.uom}
                                          </TableCell>
                                          <TableCell className="text-right font-mono">
                                            {res.consumed_qty} {material.uom}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={badge.variant}>{badge.label}</Badge>
                                          </TableCell>
                                          <TableCell>
                                            {res.status === 'active' && canModify && (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleRelease(
                                                        material.id,
                                                        res.id,
                                                        res.lp_number
                                                      )
                                                    }
                                                    disabled={releaseReservationMutation.isPending}
                                                    data-testid={`release-btn-${res.id}`}
                                                  >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Release reservation</TooltipContent>
                                              </Tooltip>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      )
                                    })}
                                  </TableBody>
                                </Table>
                              )}

                              {/* Summary */}
                              {material.reservations.length > 0 && (
                                <div className="flex items-center gap-6 pt-2 border-t text-sm">
                                  <span>
                                    <span className="text-muted-foreground">Total Reserved: </span>
                                    <span className="font-mono font-medium">
                                      {material.reserved_qty} {material.uom}
                                    </span>
                                  </span>
                                  <span>
                                    <span className="text-muted-foreground">Total Consumed: </span>
                                    <span className="font-mono font-medium">
                                      {material.consumed_qty} {material.uom}
                                    </span>
                                  </span>
                                  <span>
                                    <span className="text-muted-foreground">Remaining: </span>
                                    <span className="font-mono font-medium">
                                      {Math.max(0, material.reserved_qty - material.consumed_qty)}{' '}
                                      {material.uom}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Overall Summary */}
        <div
          className="flex items-center gap-6 p-3 bg-muted/50 rounded-lg text-sm"
          data-testid="summary"
        >
          <span>
            <span className="text-muted-foreground">Total Reserved: </span>
            <span className="font-mono font-medium">{summary.totalReserved.toFixed(2)}</span>
          </span>
          <span>
            <span className="text-muted-foreground">Total Consumed: </span>
            <span className="font-mono font-medium">{summary.totalConsumed.toFixed(2)}</span>
          </span>
          <span>
            <span className="text-muted-foreground">Total Remaining: </span>
            <span className="font-mono font-medium">{summary.totalRemaining.toFixed(2)}</span>
          </span>
        </div>

        {/* Info note */}
        <p className="text-xs text-muted-foreground">
          Consumed quantities update automatically when materials are issued.
        </p>

        {/* Reserve Modal */}
        {selectedMaterial && (
          <ReserveModal
            open={reserveModalOpen}
            woId={woId}
            woNumber={woNumber}
            woMaterialId={selectedMaterial.id}
            productId={selectedMaterial.product_id}
            productName={selectedMaterial.product_name}
            productCode={selectedMaterial.product_code}
            requiredQty={selectedMaterial.required_qty}
            currentlyReservedQty={selectedMaterial.reserved_qty}
            uom={selectedMaterial.uom}
            warehouseId={warehouseId}
            warehouseName={warehouseName}
            defaultAlgorithm="fifo"
            onReserve={handleReserve}
            onCancel={handleCloseReserveModal}
          />
        )}
      </div>
    </TooltipProvider>
  )
}

export default WOReservationsPanel
