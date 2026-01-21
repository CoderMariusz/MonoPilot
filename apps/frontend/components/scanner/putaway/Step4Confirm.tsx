/**
 * Step 4: Confirm Putaway (Story 05.21)
 * Purpose: Review and confirm putaway operation (AC-5)
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import type { LPDetails, SuggestedLocation, ScannedLocation } from './ScannerPutawayWizard'

interface FormData {
  lp: LPDetails | null
  fromLocation: string
  toLocation: SuggestedLocation | ScannedLocation | null
  override: boolean
}

interface Step4ConfirmProps {
  formData: FormData
  onConfirm: () => void
  onEdit: () => void
  isLoading?: boolean
}

export function Step4Confirm({ formData, onConfirm, onEdit, isLoading = false }: Step4ConfirmProps) {
  const { lp, fromLocation, toLocation, override } = formData

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mb-4" />
        <p className="text-gray-600 text-lg">Processing putaway...</p>
        <p className="text-gray-500 text-sm mt-2">Recording stock move...</p>
      </div>
    )
  }

  const locationCode = toLocation
    ? 'location_code' in toLocation
      ? toLocation.location_code
      : ''
    : ''

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Putaway</h2>
        <p className="text-gray-500">Review the details below</p>
      </div>

      {/* Override warning banner */}
      {override && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>Location is different from suggested</span>
        </div>
      )}

      {/* LP Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-600 mb-3">License Plate</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">LP Number:</span>
            <span className="font-mono font-medium">{lp?.lp_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Product:</span>
            <span className="font-medium">{lp?.product_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Quantity:</span>
            <span className="font-medium">{lp?.quantity} {lp?.uom}</span>
          </div>
        </div>
      </div>

      {/* Location Move */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-600 mb-3">Location Move</h3>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xs text-gray-500 mb-1">From</p>
            <p className="font-mono font-medium text-gray-700 truncate">{fromLocation || lp?.current_location}</p>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-400 mx-2 flex-shrink-0" />
          <div className="text-center flex-1">
            <p className="text-xs text-gray-500 mb-1">To</p>
            <p className="font-mono font-medium text-cyan-600 truncate">{locationCode}</p>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="pb-safe space-y-3">
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'w-full h-14 min-h-[56px] text-lg font-semibold',
            'bg-green-600 hover:bg-green-700 text-white'
          )}
          aria-label="Confirm Putaway"
        >
          Confirm Putaway
        </Button>
        <Button
          onClick={onEdit}
          disabled={isLoading}
          variant="outline"
          className="w-full h-12 min-h-[48px]"
        >
          Edit
        </Button>
      </div>
    </div>
  )
}

export default Step4Confirm
