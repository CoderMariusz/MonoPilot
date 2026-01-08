/**
 * WO Availability Hook - Story 03.13
 *
 * React Query hook for fetching WO material availability data
 * with auto-refresh and caching support.
 *
 * @module lib/hooks/use-wo-availability
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { WOAvailabilityResponse } from '@/lib/types/wo-availability'

/**
 * Query key factory for WO availability
 */
export const woAvailabilityKeys = {
  all: ['wo-availability'] as const,
  detail: (woId: string) => [...woAvailabilityKeys.all, woId] as const,
}

/**
 * Fetch availability data from API
 */
async function fetchWOAvailability(woId: string): Promise<WOAvailabilityResponse> {
  const response = await fetch(`/api/planning/work-orders/${woId}/availability`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch availability data')
  }

  return response.json()
}

interface UseWOAvailabilityOptions {
  enabled?: boolean
  refetchInterval?: number | false
  staleTime?: number
}

/**
 * Hook to fetch WO material availability
 *
 * Features:
 * - Auto-refresh every 30 seconds (matches cache TTL)
 * - Refetch on window focus
 * - Error handling
 *
 * @param woId - UUID of the Work Order
 * @param options - React Query options
 * @returns Query result with availability data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useWOAvailability(woId)
 *
 * if (isLoading) return <LoadingState />
 * if (error) return <ErrorState error={error} onRetry={refetch} />
 * if (!data?.enabled) return <DisabledState />
 * if (!data?.materials.length) return <EmptyState />
 *
 * return <AvailabilityPanel data={data} />
 * ```
 */
export function useWOAvailability(
  woId: string,
  options: UseWOAvailabilityOptions = {}
) {
  const {
    enabled = true,
    refetchInterval = 30 * 1000, // 30 seconds - matches cache TTL
    staleTime = 10 * 1000, // 10 seconds
  } = options

  return useQuery<WOAvailabilityResponse, Error>({
    queryKey: woAvailabilityKeys.detail(woId),
    queryFn: () => fetchWOAvailability(woId),
    enabled: enabled && !!woId,
    staleTime,
    refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

/**
 * Hook to manually refresh availability data
 *
 * @returns Function to invalidate and refetch availability
 *
 * @example
 * ```tsx
 * const refresh = useRefreshAvailability()
 *
 * <Button onClick={() => refresh(woId)}>
 *   Refresh
 * </Button>
 * ```
 */
export function useRefreshAvailability() {
  const queryClient = useQueryClient()

  return (woId: string) => {
    return queryClient.invalidateQueries({
      queryKey: woAvailabilityKeys.detail(woId),
    })
  }
}

/**
 * Hook to get time since last check
 *
 * @param checkedAt - ISO timestamp of last check
 * @returns Formatted string like "2 min ago"
 */
export function useTimeSinceCheck(checkedAt: string | undefined): string {
  if (!checkedAt) return 'Never'

  const now = new Date()
  const checked = new Date(checkedAt)
  const diffMs = now.getTime() - checked.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)

  if (diffSec < 60) {
    return 'just now'
  }
  if (diffMin < 60) {
    return `${diffMin} min ago`
  }

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) {
    return `${diffHours} hr ago`
  }

  return checked.toLocaleDateString()
}
