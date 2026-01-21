/**
 * Location Summary Card Component (Story 05.20)
 * Purpose: Display location summary in a card format
 * Features: Location code, path, warehouse, capacity indicator
 */

'use client'

import { cn } from '@/lib/utils'
import { Edit2, MapPin, Warehouse } from 'lucide-react'
import type { LocationLookupResult } from '@/lib/validation/scanner-move'

interface LocationSummaryCardProps {
  location: LocationLookupResult
  onEdit?: () => void
  className?: string
}

export function LocationSummaryCard({
  location,
  onEdit,
  className,
}: LocationSummaryCardProps) {
  return (
    <div
      className={cn(
        'bg-green-50 border border-green-200 rounded-lg p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-green-700">
          <MapPin className="h-5 w-5" />
          <span className="text-xs uppercase font-medium">To (Destination)</span>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 hover:text-gray-600"
            aria-label="Edit"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Location Code */}
      <div className="font-bold text-lg text-gray-900">{location.location_code}</div>

      {/* Path */}
      <div className="text-sm text-gray-600 mt-1">{location.location_path}</div>

      {/* Warehouse */}
      <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
        <Warehouse className="h-4 w-4" />
        <span>{location.warehouse_name}</span>
      </div>

      {/* Capacity */}
      {location.capacity_pct !== null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Capacity</span>
            <span className="font-medium">{location.capacity_pct}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                location.capacity_pct >= 90
                  ? 'bg-red-500'
                  : location.capacity_pct >= 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              )}
              style={{ width: `${Math.min(location.capacity_pct, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationSummaryCard
