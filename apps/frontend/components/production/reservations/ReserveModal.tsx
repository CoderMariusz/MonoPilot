/**
 * ReserveModal Component (Story 04.8)
 * Modal for selecting and reserving LPs for a WO material
 *
 * Wireframe: PLAN-026 Component 2: ReserveLPModal
 *
 * Features:
 * - Material info header
 * - Progress indicator
 * - FIFO/FEFO sort toggle
 * - AvailableLPsPicker integration
 * - Over-reservation warning with acknowledgment
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Package, RefreshCw } from 'lucide-react'
import { AvailableLPsPicker } from './AvailableLPsPicker'
import { useAvailableLPsForMaterial } from '@/lib/hooks/use-wo-reservations'
import type { AvailableLP } from '@/lib/validation/wo-reservations'

export interface LPSelection {
  lpId: string
  lpNumber: string
  quantity: number
  lotNumber: string | null
  expiryDate: string | null
}

export interface ReserveModalProps {
  /** Modal open state */
  open: boolean
  /** Work order ID */
  woId: string
  /** Work order number for display */
  woNumber: string
  /** WO material ID */
  woMaterialId: string
  /** Product ID */
  productId: string
  /** Product name */
  productName: string
  /** Product code */
  productCode: string
  /** Required quantity */
  requiredQty: number
  /** Already reserved quantity */
  currentlyReservedQty: number
  /** Unit of measure */
  uom: string
  /** Warehouse ID for filtering */
  warehouseId: string
  /** Warehouse name for display */
  warehouseName: string
  /** Default sort algorithm from warehouse settings */
  defaultAlgorithm: 'fifo' | 'fefo'
  /** Callback when reservations are submitted */
  onReserve: (selections: LPSelection[], acknowledgeOverReservation: boolean) => Promise<void>
  /** Callback when modal is closed */
  onCancel: () => void
}

export function ReserveModal({
  open,
  woId,
  woNumber,
  woMaterialId,
  productId,
  productName,
  productCode,
  requiredQty,
  currentlyReservedQty,
  uom,
  warehouseId,
  warehouseName,
  defaultAlgorithm,
  onReserve,
  onCancel,
}: ReserveModalProps) {
  // Selection state
  const [selectedLPs, setSelectedLPs] = useState<Map<string, number>>(new Map())
  const [sortOrder, setSortOrder] = useState<'fifo' | 'fefo'>(defaultAlgorithm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [acknowledgeOver, setAcknowledgeOver] = useState(false)

  // Fetch available LPs
  const {
    data: availableLPsData,
    isLoading,
    error,
    refetch,
  } = useAvailableLPsForMaterial(woId, woMaterialId, { sort: sortOrder }, { enabled: open })

  const availableLPs = availableLPsData?.lps || []

  // Calculate totals
  const totalSelected = useMemo(() => {
    let total = 0
    selectedLPs.forEach((qty) => {
      total += qty
    })
    return total
  }, [selectedLPs])

  const isOverReserved = currentlyReservedQty + totalSelected > requiredQty

  // Handle selection changes
  const handleSelect = useCallback((lpId: string, selected: boolean) => {
    setSelectedLPs((prev) => {
      const next = new Map(prev)
      if (selected) {
        // Find LP to get default quantity
        const lp = availableLPs.find((l) => l.id === lpId)
        next.set(lpId, lp?.available_qty || 0)
      } else {
        next.delete(lpId)
      }
      return next
    })
  }, [availableLPs])

  const handleQuantityChange = useCallback((lpId: string, quantity: number) => {
    setSelectedLPs((prev) => {
      const next = new Map(prev)
      if (quantity > 0) {
        next.set(lpId, quantity)
      } else {
        next.delete(lpId)
      }
      return next
    })
  }, [])

  const handleSortChange = useCallback((order: 'fifo' | 'fefo') => {
    setSortOrder(order)
  }, [])

  // Handle submit
  const handleSubmit = async () => {
    if (selectedLPs.size === 0) return

    // Build selections
    const selections: LPSelection[] = []
    selectedLPs.forEach((quantity, lpId) => {
      const lp = availableLPs.find((l) => l.id === lpId)
      if (lp) {
        selections.push({
          lpId: lp.id,
          lpNumber: lp.lp_number,
          quantity,
          lotNumber: lp.lot_number || null,
          expiryDate: lp.expiry_date || null,
        })
      }
    })

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onReserve(selections, acknowledgeOver)
      // Reset state on success
      setSelectedLPs(new Map())
      setAcknowledgeOver(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to reserve LPs')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle close
  const handleClose = () => {
    setSelectedLPs(new Map())
    setAcknowledgeOver(false)
    setSubmitError(null)
    onCancel()
  }

  // Disable submit if over-reserved and not acknowledged
  const canSubmit = selectedLPs.size > 0 && (!isOverReserved || acknowledgeOver) && !isSubmitting

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-labelledby="reserve-modal-title"
        data-testid="reserve-modal"
      >
        <DialogHeader>
          <DialogTitle id="reserve-modal-title">Reserve License Plates</DialogTitle>
          <DialogDescription>
            Select LPs to reserve for {productName} ({productCode})
          </DialogDescription>
        </DialogHeader>

        {/* Material Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg" data-testid="material-info">
          <div>
            <p className="text-sm text-muted-foreground">Material</p>
            <p className="font-medium">
              {productName} ({productCode})
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Required Quantity</p>
            <p className="font-medium font-mono">
              {requiredQty} {uom}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Currently Reserved</p>
            <p className="font-medium font-mono">
              {currentlyReservedQty} {uom}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Warehouse</p>
            <p className="font-medium">{warehouseName}</p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" data-testid="error-state">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Failed to load available LPs: {error instanceof Error ? error.message : 'Unknown error'}
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Error */}
        {submitError && (
          <Alert variant="destructive" data-testid="submit-error">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {/* Available LPs Picker */}
        {!error && (
          <AvailableLPsPicker
            lps={availableLPs}
            selectedLPs={selectedLPs}
            sortOrder={sortOrder}
            isLoading={isLoading}
            requiredQty={requiredQty}
            currentlyReservedQty={currentlyReservedQty}
            uom={uom}
            onSelect={handleSelect}
            onQuantityChange={handleQuantityChange}
            onSortChange={handleSortChange}
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={isOverReserved ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
            data-testid="submit-button"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Reserving...
              </>
            ) : (
              <>Reserve Selected ({totalSelected.toFixed(1)} {uom})</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReserveModal
