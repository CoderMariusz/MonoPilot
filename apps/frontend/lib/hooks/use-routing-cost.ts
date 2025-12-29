/**
 * useRoutingCost Hook (Story 02.9)
 * React Query hook for fetching routing-only cost
 */

import { useQuery } from '@tanstack/react-query'
import type { RoutingCostResponse } from '@/lib/types/costing'

// Query keys for cache management
export const routingCostKeys = {
  all: ['routing-cost'] as const,
  detail: (routingId: string, batchSize?: number) =>
    [...routingCostKeys.all, routingId, batchSize] as const,
}

/**
 * Fetch routing cost data from API
 */
async function fetchRoutingCost(
  routingId: string,
  batchSize?: number
): Promise<RoutingCostResponse> {
  const params = new URLSearchParams()
  if (batchSize) {
    params.append('batch_size', batchSize.toString())
  }

  const url = `/api/v1/technical/routings/${routingId}/cost${
    params.toString() ? `?${params.toString()}` : ''
  }`

  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to fetch routing cost')
  }

  const data = await response.json()
  return data.cost || data
}

/**
 * Hook to fetch routing cost data
 * @param routingId - Routing ID to fetch cost for
 * @param batchSize - Optional batch size for cost calculation
 * @returns React Query result with RoutingCostResponse
 */
export function useRoutingCost(routingId: string, batchSize?: number) {
  return useQuery<RoutingCostResponse, Error>({
    queryKey: routingCostKeys.detail(routingId, batchSize),
    queryFn: () => fetchRoutingCost(routingId, batchSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!routingId,
  })
}
