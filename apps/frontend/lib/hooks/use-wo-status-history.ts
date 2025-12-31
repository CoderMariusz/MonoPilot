/**
 * React Query Hook: useWOStatusHistory
 * Story 03.10: Work Order CRUD - Status History
 *
 * Fetches status transition history for a work order
 */

import { useQuery } from '@tanstack/react-query'
import type { WOStatusHistory } from '@/lib/types/work-order'
import { workOrderKeys } from './use-work-orders'

/**
 * Fetch status history from API
 */
async function fetchStatusHistory(woId: string): Promise<WOStatusHistory[]> {
  const response = await fetch(`/api/planning/work-orders/${woId}/history`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch status history')
  }

  const data = await response.json()
  return data.data || data.history || []
}

/**
 * Hook to fetch status history for a work order
 *
 * @param woId - Work order UUID
 * @returns Query result with status history array
 */
export function useWOStatusHistory(woId: string | null | undefined) {
  return useQuery({
    queryKey: workOrderKeys.statusHistory(woId || ''),
    queryFn: () => fetchStatusHistory(woId!),
    enabled: !!woId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export default useWOStatusHistory
