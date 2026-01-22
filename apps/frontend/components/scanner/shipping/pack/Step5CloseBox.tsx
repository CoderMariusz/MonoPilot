/**
 * Step 5: Close Box Component (Story 07.12)
 * Purpose: Close box with optional weight entry
 * Features: Box summary, weight modal, dimension inputs
 *
 * States: loading, error, empty, success
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Package, Scale, Check } from 'lucide-react'
import { LargeTouchButton } from '../../shared/LargeTouchButton'
import { WeightEntryModal } from './WeightEntryModal'
import type { ShipmentBox, BoxContent } from '@/lib/hooks/use-scanner-pack'

interface Step5CloseBoxProps {
  box: ShipmentBox
  contents: BoxContent[]
  boxNumber: number
  onClose: (weight?: number, dimensions?: { length: number; width: number; height: number }) => void
  onCreateNext: () => void
  onCancel: () => void
  className?: string
}

export function Step5CloseBox({
  box,
  contents,
  boxNumber,
  onClose,
  onCreateNext,
  onCancel,
  className,
}: Step5CloseBoxProps) {
  const [showWeightModal, setShowWeightModal] = useState(false)

  // Calculate summary
  const itemCount = contents.length
  const estimatedWeight = contents.reduce((sum, c) => sum + (c.quantity * 0.5), 0)

  // Handle close box action
  const handleCloseBox = () => {
    setShowWeightModal(true)
  }

  // Handle weight confirm
  const handleWeightConfirm = (weight?: number, length?: number, width?: number, height?: number) => {
    setShowWeightModal(false)
    const dimensions = length && width && height
      ? { length, width, height }
      : undefined
    onClose(weight, dimensions)
  }

  // Handle skip weight
  const handleSkipWeight = () => {
    setShowWeightModal(false)
    onClose(undefined, undefined)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Box Summary Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-lg text-gray-900">
            Close Box {boxNumber}
          </span>
        </div>
        <p className="text-sm text-gray-500">Review contents before closing</p>
      </div>

      {/* Box Contents Summary */}
      <div data-testid="box-summary" className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg border p-4">
          {/* Summary stats */}
          <div className="flex items-center justify-between pb-3 border-b mb-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{itemCount}</span> items
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Scale className="h-4 w-4" />
              <span>~{estimatedWeight.toFixed(1)} kg</span>
            </div>
          </div>

          {/* Contents list */}
          <div className="space-y-3">
            {contents.map((content) => (
              <div key={content.id} className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{content.productName}</p>
                  <p className="text-xs text-gray-500">Lot: {content.lotNumber}</p>
                  <p className="text-xs text-gray-500">LP: {content.lpNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {content.quantity} {content.uom}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {contents.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No items in box</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-white border-t space-y-3 safe-area-bottom">
        <LargeTouchButton
          size="full"
          variant="success"
          onClick={handleCloseBox}
          disabled={contents.length === 0}
          className="gap-2"
        >
          <Check className="h-5 w-5" />
          Close Box
        </LargeTouchButton>

        <LargeTouchButton
          size="full"
          variant="secondary"
          onClick={onCancel}
        >
          Add More Items
        </LargeTouchButton>
      </div>

      {/* Weight Entry Modal */}
      {showWeightModal && (
        <WeightEntryModal
          boxNumber={boxNumber}
          estimatedWeight={estimatedWeight}
          onConfirm={handleWeightConfirm}
          onSkip={handleSkipWeight}
          onCancel={() => setShowWeightModal(false)}
        />
      )}
    </div>
  )
}

export default Step5CloseBox
