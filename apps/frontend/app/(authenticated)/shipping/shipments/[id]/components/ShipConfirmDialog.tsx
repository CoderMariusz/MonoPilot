/**
 * ShipConfirmDialog Component
 * Story 07.14: Shipment Manifest & Ship + Tracking
 *
 * Confirmation dialog for irreversible ship action
 * - Displays shipment details summary
 * - Requires checkbox acknowledgment
 * - Loading state during submission
 * - Keyboard accessible (Escape to close, Tab trap)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, AlertTriangle, Truck, Package, Scale, FileText } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface ShipmentInfo {
  id: string
  shipment_number: string
  customer_name: string
  total_boxes: number
  total_weight: number | null
  sales_order_number: string
}

export interface ShipConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  shipment: ShipmentInfo
  licensePlateCount: number
  isLoading?: boolean
}

// =============================================================================
// Component
// =============================================================================

export function ShipConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  shipment,
  licensePlateCount,
  isLoading = false,
}: ShipConfirmDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  // Reset checkbox when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAcknowledged(false)
    }
  }, [isOpen])

  // Handle Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose()
      }
    },
    [isOpen, isLoading, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleConfirm = async () => {
    if (acknowledged && !isLoading) {
      await onConfirm()
    }
  }

  const canConfirm = acknowledged && !isLoading

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        role="alertdialog"
        aria-label="Confirm irreversible shipment action"
        className="sm:max-w-lg"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
            Confirm Shipment
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-amber-600 font-medium">
                This action is <strong>irreversible</strong>. Once shipped, you cannot undo this
                action.
              </p>

              {/* Shipment Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Shipment Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Shipment:</span>
                  </div>
                  <span className="font-medium">{shipment.shipment_number}</span>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Customer:</span>
                  </div>
                  <span className="font-medium">{shipment.customer_name}</span>

                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Boxes:</span>
                  </div>
                  <span className="font-medium">{shipment.total_boxes}</span>

                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Total Weight:</span>
                  </div>
                  <span className="font-medium">
                    {shipment.total_weight ? `${shipment.total_weight} kg` : 'Not recorded'}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">License Plates:</span>
                  </div>
                  <span className="font-medium">{licensePlateCount} license plates</span>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Sales Order:</span>
                  </div>
                  <span className="font-medium">{shipment.sales_order_number}</span>
                </div>
              </div>

              {/* Impact Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-amber-800 mb-2">This will:</p>
                <ul className="list-disc list-inside text-amber-700 space-y-1">
                  <li>Mark shipment as shipped</li>
                  <li>Consume all {licensePlateCount} license plates</li>
                  <li>Update sales order {shipment.sales_order_number} to shipped</li>
                  <li>Reserved inventory cannot be undone</li>
                </ul>
              </div>

              {/* Acknowledgment Checkbox */}
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="acknowledge-irreversible"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                  disabled={isLoading}
                  aria-describedby="acknowledge-help"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="acknowledge-irreversible"
                    className="text-sm font-medium cursor-pointer"
                  >
                    I understand this action is irreversible
                  </Label>
                  <p id="acknowledge-help" className="text-xs text-gray-500">
                    You must acknowledge the irreversibility before shipping
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} autoFocus>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Shipping...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" aria-hidden="true" />
                Ship Shipment
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ShipConfirmDialog
