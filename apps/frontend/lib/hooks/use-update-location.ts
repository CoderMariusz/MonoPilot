/**
 * useUpdateLocation Hook
 * Story: 01.9 - Location Hierarchy Management
 */

'use client'

import { useState } from 'react'
import type { UpdateLocationInput, Location } from '@/lib/types/location'

export function useUpdateLocation(warehouseId: string) {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, input }: { id: string; input: UpdateLocationInput }): Promise<Location> => {
    setIsPending(true)
    try {
      const response = await fetch(`/api/settings/warehouses/${warehouseId}/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update location')
      }

      return data
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}
