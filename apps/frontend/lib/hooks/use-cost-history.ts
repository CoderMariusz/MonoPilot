/**
 * useCostHistory Hook (Story 02.15)
 * React Query hook for fetching cost history data
 */

import { useQuery } from '@tanstack/react-query'
import type { CostHistoryResponse, CostHistoryOptions } from '@/lib/types/cost-history'

// Query keys for cache management
export const costHistoryKeys = {
  all: ['cost-history'] as const,
  detail: (productId: string, options?: CostHistoryOptions) =>
    [...costHistoryKeys.all, productId, options] as const,
}

/**
 * Fetch cost history data from API
 */
async function fetchCostHistory(
  productId: string,
  options?: CostHistoryOptions
): Promise<CostHistoryResponse> {
  const params = new URLSearchParams()

  if (options?.from) params.set('from', options.from)
  if (options?.to) params.set('to', options.to)
  if (options?.type && options.type !== 'all') params.set('type', options.type)
  if (options?.page) params.set('page', String(options.page))
  if (options?.limit) params.set('limit', String(options.limit))

  const url = `/api/technical/costing/products/${productId}/history${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to fetch cost history')
  }

  return response.json()
}

/**
 * Hook to fetch cost history data for a product
 * @param productId - Product ID to fetch cost history for
 * @param options - Optional query parameters (from, to, type, page, limit)
 * @returns React Query result with CostHistoryResponse
 */
export function useCostHistory(productId: string, options?: CostHistoryOptions) {
  return useQuery<CostHistoryResponse, Error>({
    queryKey: costHistoryKeys.detail(productId, options),
    queryFn: () => fetchCostHistory(productId, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!productId,
  })
}
