/**
 * useUpdateWarehouse Hook
 * Story: 01.8 - Warehouse Management
 */

import { useState } from 'react'
import type { UpdateWarehouseInput, Warehouse } from '@/lib/types/warehouse'

export function useUpdateWarehouse() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, input }: { id: string; input: UpdateWarehouseInput }): Promise<Warehouse> => {
    setIsPending(true)
    try {
      const response = await fetch(`/api/settings/warehouses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update warehouse')
      }

      return data
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}
