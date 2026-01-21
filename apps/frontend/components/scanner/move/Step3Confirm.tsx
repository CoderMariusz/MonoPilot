/**
 * Step 3: Confirm Move Component (Story 05.20)
 * Purpose: Review and confirm LP movement
 * Features: Move summary, LP details, direction arrow, confirm/cancel
 */

'use client'

import { cn } from '@/lib/utils'
import { ArrowDown, Edit2, Loader2 } from 'lucide-react'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { LPSummaryCard } from './LPSummaryCard'
import { LocationSummaryCard } from './LocationSummaryCard'
import { MoveDirectionArrow } from './MoveDirectionArrow'
import type { LPLookupResult, LocationLookupResult } from '@/lib/validation/scanner-move'

interface Step3ConfirmProps {
  lp: LPLookupResult
  destination: LocationLookupResult
  onConfirm: () => void
  onEditLP: () => void
  onEditDestination: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function Step3Confirm({
  lp,
  destination,
  onConfirm,
  onEditLP,
  onEditDestination,
  onCancel,
  isLoading = false,
}: Step3ConfirmProps) {
  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
      {/* Header */}
      <div className="text-center pb-2">
        <h2 className="text-lg font-semibold text-gray-900">Confirm Move</h2>
        <p className="text-sm text-gray-500">Review the details below and confirm the move</p>
      </div>

      {/* LP Summary Card with Edit */}
      <div className="relative">
        <LPSummaryCard lp={lp} showStatus onEdit={onEditLP} />
      </div>

      {/* From Location */}
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase font-medium">From</span>
            <div className="font-medium text-gray-900">{lp.location.code}</div>
            <div className="text-sm text-gray-500">{lp.location.path}</div>
          </div>
          <button
            onClick={onEditLP}
            className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 hover:text-gray-600"
            aria-label="Edit"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Direction Arrow */}
      <MoveDirectionArrow />

      {/* To Location */}
      <div className="relative">
        <LocationSummaryCard location={destination} onEdit={onEditDestination} />
      </div>

      {/* Actions */}
      <div className="mt-auto pt-4 space-y-3">
        {/* Loading spinner during submit */}
        {isLoading && (
          <div
            className="flex items-center justify-center py-4"
            data-testid="loading-spinner"
          >
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Processing move...</span>
          </div>
        )}

        {/* Confirm button */}
        <LargeTouchButton
          size="full"
          variant="success"
          onClick={onConfirm}
          disabled={isLoading}
          className={cn('min-h-[56px]', isLoading && 'opacity-50')}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            'Confirm Move'
          )}
        </LargeTouchButton>

        {/* Cancel link */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className={cn(
            'w-full py-3 text-gray-600 hover:text-gray-800 font-medium',
            'min-h-[48px] transition-colors',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default Step3Confirm
