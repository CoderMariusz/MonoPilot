/**
 * useCreateWarehouse Hook
 * Story: 01.8 - Warehouse Management
 */

import { useState } from 'react'
import type { CreateWarehouseInput, Warehouse } from '@/lib/types/warehouse'

export function useCreateWarehouse() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: CreateWarehouseInput): Promise<Warehouse> => {
    setIsPending(true)
    try {
      const response = await fetch('/api/v1/settings/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create warehouse')
      }

      return data
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}
