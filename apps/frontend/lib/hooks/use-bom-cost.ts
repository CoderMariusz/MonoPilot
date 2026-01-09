/**
 * useBOMCost Hook (Story 02.9)
 * React Query hook for fetching BOM cost data
 */

import { useQuery } from '@tanstack/react-query'
import type { BOMCostResponse } from '@/lib/types/costing'

// Query keys for cache management
export const bomCostKeys = {
  all: ['bom-cost'] as const,
  detail: (bomId: string) => [...bomCostKeys.all, bomId] as const,
}

/**
 * Fetch BOM cost data from API
 */
async function fetchBOMCost(bomId: string): Promise<BOMCostResponse> {
  const response = await fetch(`/api/technical/boms/${bomId}/cost`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to fetch cost')
  }

  const data = await response.json()
  return data.cost || data
}

/**
 * Hook to fetch BOM cost data
 * @param bomId - BOM ID to fetch cost for
 * @returns React Query result with BOMCostResponse
 */
export function useBOMCost(bomId: string) {
  return useQuery<BOMCostResponse, Error>({
    queryKey: bomCostKeys.detail(bomId),
    queryFn: () => fetchBOMCost(bomId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!bomId,
  })
}
