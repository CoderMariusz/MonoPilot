/**
 * Location Card Component (Story 07.10)
 * Displays location information (zone, path)
 */

'use client'

import { cn } from '@/lib/utils'

interface LocationCardProps {
  location: { zone: string; path: string }
  className?: string
}

// Zone color mapping
const ZONE_COLORS: Record<string, string> = {
  CHILLED: 'bg-blue-500 text-white',
  FROZEN: 'bg-cyan-600 text-white',
  AMBIENT: 'bg-green-500 text-white',
  DRY: 'bg-amber-500 text-white',
  default: 'bg-gray-500 text-white',
}

export function LocationCard({ location, className }: LocationCardProps) {
  const zoneColor = ZONE_COLORS[location.zone.toUpperCase()] || ZONE_COLORS.default

  return (
    <div
      data-testid="location-card"
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4',
        className
      )}
    >
      <p className="text-sm text-gray-500 mb-2">Go to location</p>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            zoneColor
          )}
        >
          {location.zone}
        </span>
        <span className="text-2xl font-bold text-gray-900" style={{ fontSize: '32px' }}>
          {location.path}
        </span>
      </div>
    </div>
  )
}

export default LocationCard
