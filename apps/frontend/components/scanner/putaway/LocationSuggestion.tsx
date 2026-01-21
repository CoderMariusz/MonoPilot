/**
 * Location Suggestion Component (Story 05.21)
 * Purpose: Display suggested location with reason badge
 */

'use client'

import { cn } from '@/lib/utils'
import { MapPin, Lightbulb, AlertTriangle } from 'lucide-react'
import type { LocationSuggestionData } from './ScannerPutawayWizard'

interface LocationSuggestionProps {
  suggestion: LocationSuggestionData
  className?: string
}

export function LocationSuggestion({ suggestion, className }: LocationSuggestionProps) {
  const { suggestedLocation, reason, reasonCode, strategyUsed } = suggestion

  // No suggested location
  if (!suggestedLocation) {
    return (
      <div className={cn('rounded-lg p-6 bg-amber-50 border border-amber-200', className)}>
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-xl font-semibold text-amber-700 mb-2">No available locations</h3>
          <p className="text-amber-600">{reason}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main location card */}
      <div className="rounded-lg p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200">
        <div className="flex flex-col items-center text-center">
          <MapPin className="w-12 h-12 text-cyan-500 mb-3" />
          <span className="text-3xl font-bold font-mono text-cyan-700 mb-2">
            {suggestedLocation.location_code}
          </span>
          <p className="text-sm text-cyan-600">{suggestedLocation.full_path}</p>
        </div>
      </div>

      {/* Location details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-600 mb-3">Location Details:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {suggestedLocation.aisle && (
            <div className="flex justify-between">
              <span className="text-gray-500">Aisle:</span>
              <span className="font-medium">{suggestedLocation.aisle}</span>
            </div>
          )}
          {suggestedLocation.rack && (
            <div className="flex justify-between">
              <span className="text-gray-500">Rack:</span>
              <span className="font-medium">{suggestedLocation.rack}</span>
            </div>
          )}
          {suggestedLocation.level && (
            <div className="flex justify-between">
              <span className="text-gray-500">Level:</span>
              <span className="font-medium">{suggestedLocation.level}</span>
            </div>
          )}
          {suggestedLocation.zone_name && (
            <div className="flex justify-between col-span-2">
              <span className="text-gray-500">Zone:</span>
              <span className="font-medium">{suggestedLocation.zone_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reason badge */}
      <div className="flex items-start gap-2 p-3 bg-yellow-900 text-yellow-300 rounded-lg">
        <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-medium">Suggested Reason:</span>
          <p className="text-sm">{reason}</p>
        </div>
      </div>
    </div>
  )
}

export default LocationSuggestion
