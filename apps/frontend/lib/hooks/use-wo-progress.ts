/**
 * React Query Hook: useWOProgress
 * Story 04.7d: Multiple Outputs per WO - Progress Tracking
 *
 * Fetches WO progress data including:
 * - Planned vs output quantity
 * - Progress percentage
 * - Remaining quantity
 * - Auto-complete status
 */

import { useQuery } from '@tanstack/react-query'
import type { WOProgressResponse } from '@/lib/services/output-aggregation-service'

/**
 * Query key factory for WO progress
 */
export const woProgressKeys = {
  all: ['wo-progress'] as const,
  detail: (woId: string) => [...woProgressKeys.all, woId] as const,
}

/**
 * Fetch WO progress from API
 */
async function fetchWOProgress(woId: string): Promise<WOProgressResponse> {
  const response = await fetch(`/api/production/work-orders/${woId}/progress`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Work order not found')
    }
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch WO progress')
  }

  const data = await response.json()
  return data.data
}

/**
 * Hook to fetch WO progress data
 *
 * @param woId - Work order ID
 * @returns Progress data, loading state, refetch function
 */
export function useWOProgress(woId: string | null | undefined) {
  const query = useQuery({
    queryKey: woProgressKeys.detail(woId || ''),
    queryFn: () => fetchWOProgress(woId!),
    enabled: !!woId,
    staleTime: 10 * 1000, // 10 seconds - short for real-time updates
    refetchOnWindowFocus: true,
  })

  return {
    progress: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  }
}

export default useWOProgress
