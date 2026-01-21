/**
 * Step 2: View Suggestion (Story 05.21)
 * Purpose: Display suggested putaway location with reason
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MapPin, Lightbulb, ChevronRight, AlertTriangle } from 'lucide-react'
import { LocationSuggestion } from './LocationSuggestion'
import type { LocationSuggestionData, SuggestedLocation } from './ScannerPutawayWizard'

interface Step2ViewSuggestionProps {
  suggestion: LocationSuggestionData
  onNext: () => void
}

export function Step2ViewSuggestion({ suggestion, onNext }: Step2ViewSuggestionProps) {
  const hasLocation = suggestion.suggestedLocation !== null

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Optimal Putaway Location</h2>
      </div>

      {/* Location Suggestion Component */}
      <LocationSuggestion suggestion={suggestion} />

      {/* Alternatives */}
      {suggestion.alternatives && suggestion.alternatives.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Alternative Locations</h3>
          <div className="space-y-2">
            {suggestion.alternatives.map((alt) => (
              <div
                key={alt.id}
                className="p-3 bg-slate-100 rounded-lg flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-medium">{alt.location_code}</span>
                  <p className="text-sm text-gray-500">{alt.reason}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action bar */}
      <div className="pb-safe space-y-3">
        {hasLocation ? (
          <Button
            onClick={onNext}
            className={cn(
              'w-full h-12 min-h-[48px] text-lg font-semibold',
              'bg-cyan-600 hover:bg-cyan-700 text-white'
            )}
            aria-label="Next: Scan Location"
          >
            Next: Scan Location
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={onNext}
            className={cn(
              'w-full h-12 min-h-[48px] text-lg font-semibold',
              'bg-amber-600 hover:bg-amber-700 text-white'
            )}
          >
            Scan Location Manually
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default Step2ViewSuggestion
