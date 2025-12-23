/**
 * useDeleteLocation Hook
 * Story: 01.9 - Location Hierarchy Management
 */

'use client'

import { useState } from 'react'

export function useDeleteLocation(warehouseId: string) {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (locationId: string): Promise<void> => {
    setIsPending(true)
    try {
      const response = await fetch(`/api/settings/warehouses/${warehouseId}/locations/${locationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete location')
      }
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}
