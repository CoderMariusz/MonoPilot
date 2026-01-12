/**
 * LP Merge Location Picker Component (Story 05.18)
 * Dropdown for selecting target location for merged LP
 *
 * Features:
 * - Filters locations by warehouse
 * - Shows location full path
 * - Default option uses first source LP&apos;s location
 *
 * Per AC-20
 */

'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MapPin } from 'lucide-react'

interface Location {
  id: string
  name: string
  full_path?: string
}

interface LPMergeLocationPickerProps {
  locations: Location[]
  selectedLocationId: string | null
  onLocationChange: (locationId: string | null) => void
  warehouseId: string
}

export function LPMergeLocationPicker({
  locations,
  selectedLocationId,
  onLocationChange,
}: LPMergeLocationPickerProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="target-location" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Target Location
      </Label>
      <Select
        value={selectedLocationId || 'default'}
        onValueChange={(value) => {
          onLocationChange(value === 'default' ? null : value)
        }}
      >
        <SelectTrigger id="target-location">
          <SelectValue placeholder="Select target location">
            {selectedLocationId
              ? locations.find((l) => l.id === selectedLocationId)?.name ||
                'Unknown'
              : "Use first LP&apos;s location (default)"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">
            Use first LP&apos;s location (default)
          </SelectItem>
          {locations.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
              {location.full_path && (
                <span className="ml-2 text-xs text-gray-500">
                  {location.full_path}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500">
        New LP will be created at:{' '}
        {selectedLocationId
          ? locations.find((l) => l.id === selectedLocationId)?.name ||
            'Selected location'
          : "First source LP&apos;s location"}
      </p>
    </div>
  )
}
