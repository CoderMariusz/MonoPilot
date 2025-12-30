/**
 * React Hook: Single Warehouse
 * Story: 01.8 - Warehouses CRUD
 *
 * Fetches a single warehouse by ID
 * Uses React Query for caching
 */

import { useQuery } from '@tanstack/react-query'
import type { Warehouse } from '@/lib/types/warehouse'

/**
 * Fetches a single warehouse by ID
 */
export function useWarehouse(id: string) {
  return useQuery({
    queryKey: ['warehouse', id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/settings/warehouses/${id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch warehouse')
      }

      return response.json() as Promise<Warehouse>
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  })
}
