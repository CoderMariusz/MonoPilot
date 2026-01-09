/**
 * React Hook: Single Machine
 * Story: 01.10 - Machines CRUD
 *
 * Fetches a single machine by ID
 * Uses React Query for caching
 */

import { useQuery } from '@tanstack/react-query'
import type { Machine } from '@/lib/types/machine'

/**
 * Fetches a single machine by ID
 */
export function useMachine(id: string | null) {
  return useQuery({
    queryKey: ['machine', id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/settings/machines/${id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch machine')
      }

      const result = await response.json()
      return result.machine as Machine
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  })
}
