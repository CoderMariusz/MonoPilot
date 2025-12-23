/**
 * useDisableWarehouse Hook
 * Story: 01.8 - Warehouse Management
 */

import { useState } from 'react'
import type { Warehouse } from '@/lib/types/warehouse'

export function useDisableWarehouse() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (id: string): Promise<Warehouse> => {
    setIsPending(true)
    try {
      const response = await fetch(`/api/settings/warehouses/${id}/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable warehouse')
      }

      return data
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}
