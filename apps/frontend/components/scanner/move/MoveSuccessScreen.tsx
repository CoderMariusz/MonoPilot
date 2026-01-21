/**
 * Move Success Screen Component (Story 05.20)
 * Purpose: Display success after LP move completed
 * Features: Success animation, move details, action buttons
 */

'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, ArrowRight, RotateCcw, Plus, X } from 'lucide-react'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { SuccessAnimation } from '../shared/SuccessAnimation'
import type { ScannerMoveResult } from '@/lib/validation/scanner-move'

interface MoveSuccessScreenProps {
  result: ScannerMoveResult
  onMoveAnother: () => void
  onNewMove: () => void
  onDone: () => void
}

export function MoveSuccessScreen({
  result,
  onMoveAnother,
  onNewMove,
  onDone,
}: MoveSuccessScreenProps) {
  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      {/* Success Animation */}
      <div className="flex flex-col items-center justify-center py-6">
        <SuccessAnimation show size={80} />
        <h2 className="text-xl font-semibold text-gray-900 mt-4">Move Successful!</h2>
        <p className="text-gray-500 text-center mt-1">
          The license plate has been moved to its new location
        </p>
      </div>

      {/* Move Details */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        {/* Move Number */}
        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
          <span className="text-sm text-gray-500">Move Number</span>
          <span className="font-mono font-medium text-gray-900">{result.stock_move.move_number}</span>
        </div>

        {/* LP Info */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">License Plate</span>
            <span className="font-mono font-medium text-gray-900">{result.lp.lp_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Product</span>
            <span className="font-medium text-gray-900">{result.lp.product_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Quantity</span>
            <span className="font-medium text-gray-900">
              {result.lp.quantity} {result.lp.uom}
            </span>
          </div>
        </div>

        {/* New Location */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>New Location</span>
          </div>
          <div className="font-medium text-gray-900 ml-6">{result.lp.location_path}</div>
        </div>

        {/* Timestamp */}
        <div className="pt-2 border-t border-gray-200 text-xs text-gray-400">
          Completed: {new Date(result.stock_move.move_date).toLocaleString()}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto pt-4 space-y-3">
        {/* Move Another to Same Location */}
        <LargeTouchButton
          size="full"
          variant="primary"
          onClick={onMoveAnother}
          className="min-h-[56px]"
        >
          <RotateCcw className="h-5 w-5 mr-2" />
          Move Another to Same Location
        </LargeTouchButton>

        {/* New Move */}
        <LargeTouchButton
          size="full"
          variant="secondary"
          onClick={onNewMove}
        >
          <Plus className="h-5 w-5 mr-2" />
          New Move
        </LargeTouchButton>

        {/* Done */}
        <LargeTouchButton
          size="full"
          variant="secondary"
          onClick={onDone}
        >
          <X className="h-5 w-5 mr-2" />
          Done
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default MoveSuccessScreen
