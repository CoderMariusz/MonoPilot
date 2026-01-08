/**
 * Availability Warning Modal Component - Story 03.13
 *
 * Modal dialog shown when attempting to release/save a Work Order
 * with material shortages. Lists materials with issues and allows
 * user to proceed or cancel.
 *
 * @module components/planning/work-orders/availability/AvailabilityWarningModal
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { MaterialAvailability } from '@/lib/types/wo-availability'
import { formatCoverage, getStatusLabel } from '@/lib/types/wo-availability'
import { AvailabilityTrafficLight } from './AvailabilityTrafficLight'

export interface AvailabilityWarningModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  materials: MaterialAvailability[]
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  actionLabel?: string
}

/**
 * Format quantity with UoM
 */
function formatQty(qty: number, uom: string): string {
  return `${qty.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${uom}`
}

/**
 * Material item in the shortage list
 */
function ShortageMaterialItem({ material }: { material: MaterialAvailability }) {
  return (
    <div
      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
      data-testid={`shortage-item-${material.product_id}`}
    >
      <AvailabilityTrafficLight
        status={material.status}
        size="sm"
        showTooltip={false}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{material.product_name}</span>
          <span className="text-xs text-muted-foreground">({material.product_code})</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Required: {formatQty(material.required_qty, material.uom)} |{' '}
          Available: {formatQty(material.available_qty, material.uom)} |{' '}
          <span className={cn(
            'font-medium',
            material.coverage_percent < 50 ? 'text-red-600' : 'text-yellow-600'
          )}>
            Shortage: {formatQty(material.shortage_qty, material.uom)} ({formatCoverage(material.coverage_percent)})
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Warning modal for material shortages
 *
 * Displayed when user attempts to release/save a WO with insufficient materials.
 * Shows list of materials with issues and allows user to proceed anyway or cancel.
 *
 * @param open - Modal open state
 * @param onOpenChange - Callback when open state changes
 * @param materials - Materials with shortage/low_stock status
 * @param onConfirm - Callback when user proceeds
 * @param onCancel - Callback when user cancels
 * @param isLoading - Loading state for confirm button
 * @param actionLabel - Custom label for action (default: "Release")
 *
 * @example
 * ```tsx
 * <AvailabilityWarningModal
 *   open={showWarning}
 *   onOpenChange={setShowWarning}
 *   materials={materialsWithIssues}
 *   onConfirm={handleProceed}
 *   onCancel={() => setShowWarning(false)}
 * />
 * ```
 */
export function AvailabilityWarningModal({
  open,
  onOpenChange,
  materials,
  onConfirm,
  onCancel,
  isLoading = false,
  actionLabel = 'Release',
}: AvailabilityWarningModalProps) {
  // Filter to only show materials with issues
  const materialsWithIssues = materials.filter(
    (m) => m.status !== 'sufficient'
  )

  const shortageCount = materialsWithIssues.filter(
    (m) => m.status === 'shortage' || m.status === 'no_stock'
  ).length

  const lowStockCount = materialsWithIssues.filter(
    (m) => m.status === 'low_stock'
  ).length

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg sm:max-w-xl"
        role="alertdialog"
        aria-labelledby="warning-title"
        aria-describedby="warning-description"
      >
        <DialogHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <DialogTitle id="warning-title" className="text-center text-xl">
            Material Shortages Detected
          </DialogTitle>
          <DialogDescription id="warning-description" className="text-center">
            You are about to {actionLabel.toLowerCase()} this Work Order with material shortages.
            Production may be delayed or incomplete without sufficient materials.
          </DialogDescription>
        </DialogHeader>

        {/* Materials List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Materials with Issues:</span>
            <span className="text-muted-foreground">
              {shortageCount > 0 && <span className="text-red-600">{shortageCount} shortage</span>}
              {shortageCount > 0 && lowStockCount > 0 && ', '}
              {lowStockCount > 0 && <span className="text-yellow-600">{lowStockCount} low stock</span>}
            </span>
          </div>

          <ScrollArea className="max-h-[240px] pr-4">
            <div className="space-y-2">
              {materialsWithIssues.map((material) => (
                <ShortageMaterialItem key={material.wo_material_id} material={material} />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Confirmation Text */}
        <p className="text-center text-sm text-muted-foreground pt-2">
          Are you sure you want to proceed?
        </p>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
            data-testid="cancel-button"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
            data-testid="proceed-button"
          >
            {isLoading ? 'Processing...' : 'Proceed Anyway'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AvailabilityWarningModal
