/**
 * useCreateLocation Hook
 * Story: 01.9 - Location Hierarchy Management
 */

'use client'

import { useState } from 'react'
import type { CreateLocationInput, Location } from '@/lib/types/location'

export function useCreateLocation(warehouseId: string) {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: CreateLocationInput): Promise<Location> => {
    setIsPending(true)
    try {
      const response = await fetch(`/api/v1/settings/warehouses/${warehouseId}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create location')
      }

      return data
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}
