/**
 * Location Override Warning Component (Story 05.21)
 * Purpose: Display warning when scanned location differs from suggestion (AC-4)
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface LocationOverrideWarningProps {
  suggestedLocation: string
  selectedLocation: string
  reason: string
  onUseSuggested: () => void
  onOverride: () => void
}

export function LocationOverrideWarning({
  suggestedLocation,
  selectedLocation,
  reason,
  onUseSuggested,
  onOverride,
}: LocationOverrideWarningProps) {
  return (
    <div className="space-y-4">
      {/* Warning header */}
      <div className="flex flex-col items-center text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <div data-testid="warning-icon" className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold text-yellow-700 mb-2">
          Different from suggested location
        </h2>
        <p className="text-yellow-600">
          Override allowed. Confirm putaway at scanned location?
        </p>
      </div>

      {/* Location comparison */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Suggested:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-gray-900">{suggestedLocation}</span>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Selected:</span>
          <span className="font-mono font-medium text-cyan-600">{selectedLocation}</span>
        </div>
      </div>

      {/* Reason note */}
      {reason && (
        <p className="text-sm text-gray-500 text-center">
          Original reason: {reason}
        </p>
      )}

      {/* Action buttons */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={onOverride}
          className={cn(
            'w-full h-12 min-h-[48px] text-lg font-semibold',
            'bg-amber-600 hover:bg-amber-700 text-white'
          )}
          aria-label="Use This Location Anyway"
        >
          Use This Location Anyway
        </Button>
        <Button
          onClick={onUseSuggested}
          variant="outline"
          className={cn(
            'w-full h-12 min-h-[48px] text-lg font-semibold',
            'border-green-500 text-green-700 hover:bg-green-50'
          )}
          aria-label="Scan Suggested Location"
        >
          Scan Suggested Location
        </Button>
      </div>
    </div>
  )
}

export default LocationOverrideWarning
