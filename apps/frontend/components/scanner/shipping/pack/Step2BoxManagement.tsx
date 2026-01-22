/**
 * Step 2: Box Management Component (Story 07.12)
 * Purpose: Display shipment header, box status, and box contents
 * Features: Create new box, switch between boxes, show pack progress
 *
 * States: loading, error, empty, success
 */

'use client'

import { cn } from '@/lib/utils'
import { Package, Plus, ChevronRight, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LargeTouchButton } from '../../shared/LargeTouchButton'
import { BoxSelector } from './BoxSelector'
import type { PendingShipment, ShipmentBox, BoxContent } from '@/lib/hooks/use-scanner-pack'

interface PackProgress {
  linesTotal: number
  linesPacked: number
  remaining: number
}

interface Step2BoxManagementProps {
  shipment: PendingShipment
  boxes: ShipmentBox[]
  activeBoxId: string | null
  boxContents: BoxContent[]
  packProgress: PackProgress
  onCreateBox: () => void
  onSelectBox: (boxId: string) => void
  onProceed: () => void
  onCloseBox: () => void
  className?: string
}

export function Step2BoxManagement({
  shipment,
  boxes,
  activeBoxId,
  boxContents,
  packProgress,
  onCreateBox,
  onSelectBox,
  onProceed,
  onCloseBox,
  className,
}: Step2BoxManagementProps) {
  const activeBox = boxes.find((b) => b.id === activeBoxId)
  const openBoxes = boxes.filter((b) => b.status === 'open')
  const closedBoxes = boxes.filter((b) => b.status === 'closed')
  const hasMultipleBoxes = openBoxes.length > 1

  // Calculate box summary
  const itemCount = boxContents.length
  const weightEst = boxContents.reduce((sum, c) => sum + (c.quantity * 0.5), 0) // Rough estimate

  // Progress percentage
  const progressPct = packProgress.linesTotal > 0
    ? Math.round((packProgress.linesPacked / packProgress.linesTotal) * 100)
    : 0

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Shipment Header */}
      <div data-testid="shipment-header" className="bg-white border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <span data-testid="shipment-so-number" className="font-semibold text-lg text-gray-900">
            {shipment.soNumber}
          </span>
          <span className="text-xs text-gray-500">{shipment.shipmentNumber}</span>
        </div>
        <p data-testid="shipment-customer" className="text-sm text-gray-600">
          {shipment.customerName}
        </p>

        {/* Pack Progress */}
        <div data-testid="pack-progress" className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Pack Progress</span>
            <span className="font-medium">{packProgress.linesPacked} / {packProgress.linesTotal} lines</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Box Selector (if multiple open boxes) */}
      {hasMultipleBoxes && (
        <div data-testid="box-selector" className="px-4 pt-4">
          <BoxSelector
            boxes={openBoxes}
            activeBoxId={activeBoxId}
            onSelectBox={onSelectBox}
            onCreateBox={onCreateBox}
          />
        </div>
      )}

      {/* Current Box Status */}
      <div className="p-4 flex-1">
        <div className="bg-white rounded-lg border p-4">
          {/* Box Indicator */}
          <div
            data-testid="current-box-indicator"
            className="flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">
                Box {activeBox?.boxNumber || 1}
              </span>
            </div>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded',
              activeBox?.status === 'open'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            )}>
              {activeBox?.status || 'open'}
            </span>
          </div>

          {/* Box Summary */}
          <div data-testid="box-summary" className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-4">
              <span data-testid="box-item-count">{itemCount} items</span>
              <span data-testid="box-weight-estimate" className="flex items-center gap-1">
                <Scale className="h-3 w-3" />
                ~{weightEst.toFixed(1)} kg
              </span>
            </div>
          </div>

          {/* Box Contents Preview */}
          {itemCount > 0 && (
            <div className="border-t pt-3 space-y-2">
              <span className="text-xs text-gray-500 font-medium">Contents:</span>
              {boxContents.slice(0, 3).map((content) => (
                <div key={content.id} className="text-sm text-gray-700 flex justify-between">
                  <span className="truncate flex-1">{content.productName}</span>
                  <span className="text-gray-500 ml-2">{content.quantity} {content.uom}</span>
                </div>
              ))}
              {itemCount > 3 && (
                <p className="text-xs text-gray-400">+{itemCount - 3} more items</p>
              )}
            </div>
          )}

          {/* Empty Box Message */}
          {itemCount === 0 && (
            <div className="text-center py-4 text-gray-400">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Box is empty</p>
              <p className="text-xs">Scan items to add</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-white border-t space-y-3 safe-area-bottom">
        {/* Primary: Scan Item */}
        <LargeTouchButton
          size="full"
          variant="primary"
          onClick={onProceed}
          className="gap-2"
        >
          Scan Item
          <ChevronRight className="h-5 w-5" />
        </LargeTouchButton>

        {/* Secondary actions */}
        <div className="flex gap-3">
          <LargeTouchButton
            size="default"
            variant="secondary"
            onClick={onCreateBox}
            className="flex-1 gap-1"
          >
            <Plus className="h-4 w-4" />
            New Box
          </LargeTouchButton>

          <LargeTouchButton
            size="default"
            variant="secondary"
            onClick={onCloseBox}
            disabled={itemCount === 0}
            className="flex-1"
          >
            Close Box
          </LargeTouchButton>
        </div>
      </div>
    </div>
  )
}

export default Step2BoxManagement
