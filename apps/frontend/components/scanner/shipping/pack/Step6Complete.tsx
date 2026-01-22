/**
 * Step 6: Complete Component (Story 07.12)
 * Purpose: Show success screen after packing complete
 * Features: Summary stats, Done/New Order buttons
 *
 * States: success
 */

'use client'

import { cn } from '@/lib/utils'
import { Check, Package, Scale, Home, RefreshCw } from 'lucide-react'
import { LargeTouchButton } from '../../shared/LargeTouchButton'
import type { PendingShipment } from '@/lib/hooks/use-scanner-pack'

interface Step6CompleteProps {
  shipment: PendingShipment
  totalBoxes: number
  totalWeight: number
  onDone: () => void
  onNewOrder: () => void
  className?: string
}

export function Step6Complete({
  shipment,
  totalBoxes,
  totalWeight,
  onDone,
  onNewOrder,
  className,
}: Step6CompleteProps) {
  return (
    <div data-testid="completion-screen" className={cn('flex flex-col h-full', className)}>
      {/* Success Hero */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-green-50">
        {/* Checkmark */}
        <div
          data-testid="success-checkmark"
          className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30"
        >
          <Check className="h-14 w-14 text-white" strokeWidth={3} />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Shipment Packed!
        </h1>
        <p className="text-gray-600 text-center">
          {shipment.soNumber} is ready for shipping
        </p>

        {/* Summary Card */}
        <div className="w-full max-w-sm bg-white rounded-lg border mt-8 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Summary</h2>

          <div className="space-y-3">
            {/* Customer */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-900">{shipment.customerName}</span>
            </div>

            {/* SO Number */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order</span>
              <span className="font-medium text-gray-900">{shipment.soNumber}</span>
            </div>

            {/* Total Boxes */}
            <div data-testid="total-boxes" className="flex justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1">
                <Package className="h-4 w-4" />
                Total Boxes
              </span>
              <span className="font-medium text-gray-900">{totalBoxes}</span>
            </div>

            {/* Total Weight */}
            <div data-testid="total-weight" className="flex justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1">
                <Scale className="h-4 w-4" />
                Total Weight
              </span>
              <span className="font-medium text-gray-900">
                {totalWeight > 0 ? `${totalWeight.toFixed(1)} kg` : 'N/A'}
              </span>
            </div>

            {/* Lines Packed */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Lines Packed</span>
              <span className="font-medium text-gray-900">
                {shipment.linesTotal} / {shipment.linesTotal}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-white border-t space-y-3 safe-area-bottom">
        <LargeTouchButton
          size="full"
          variant="primary"
          onClick={onNewOrder}
          className="gap-2"
        >
          <RefreshCw className="h-5 w-5" />
          Pack New Order
        </LargeTouchButton>

        <LargeTouchButton
          size="full"
          variant="secondary"
          onClick={onDone}
          className="gap-2"
        >
          <Home className="h-5 w-5" />
          Done
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default Step6Complete
