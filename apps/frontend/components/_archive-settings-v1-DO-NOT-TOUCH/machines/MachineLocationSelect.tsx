/**
 * MachineLocationSelect Component
 * Story: 01.10 - Machines CRUD
 *
 * Hierarchical location dropdown with path display
 * Shows locations from all warehouses in org
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Location {
  id: string
  code: string
  name: string
  full_path: string
}

interface MachineLocationSelectProps {
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  className?: string
}

export function MachineLocationSelect({
  value,
  onChange,
  disabled = false,
  className,
}: MachineLocationSelectProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true)
      try {
        // Fetch all locations from all warehouses
        const response = await fetch('/api/v1/settings/locations?view=flat')
        if (response.ok) {
          const data = await response.json()
          setLocations(data.locations || [])
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLocations()
  }, [])

  const handleChange = (newValue: string) => {
    if (newValue === 'unassigned') {
      onChange(null)
    } else {
      onChange(newValue)
    }
  }

  return (
    <Select
      value={value || 'unassigned'}
      onValueChange={handleChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? 'Loading...' : 'Select location'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {locations.map((location) => (
          <SelectItem key={location.id} value={location.id}>
            {location.full_path || `${location.code} - ${location.name}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
