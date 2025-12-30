/**
 * useBOMYield Hook (Story 02.14)
 * React Query hook for BOM yield calculation and updates
 * FR-2.34: BOM Yield Calculation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { BomYieldResponse, UpdateYieldRequest, YieldUpdateParams } from '@/lib/types/bom-advanced'
import { bomKeys } from '@/lib/hooks/use-boms'

// Query keys for cache management
export const bomYieldKeys = {
  all: ['bom-yield'] as const,
  detail: (bomId: string) => [...bomYieldKeys.all, bomId] as const,
}

/**
 * Fetch BOM yield data from API
 */
async function fetchBOMYield(bomId: string): Promise<BomYieldResponse> {
  const response = await fetch(`/api/technical/boms/${bomId}/yield`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    if (response.status === 404) {
      throw new Error('BOM not found')
    }

    throw new Error(error.message || error.error || 'Failed to fetch yield data')
  }

  const data = await response.json()
  return data.yield || data
}

/**
 * Update BOM yield settings
 */
async function updateBOMYield(
  bomId: string,
  request: UpdateYieldRequest
): Promise<BomYieldResponse> {
  const response = await fetch(`/api/technical/boms/${bomId}/yield`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    if (response.status === 400) {
      throw new Error(error.message || 'Invalid yield configuration')
    }
    if (response.status === 403) {
      throw new Error('You do not have permission to update yield settings')
    }
    if (response.status === 404) {
      throw new Error('BOM not found')
    }

    throw new Error(error.message || error.error || 'Failed to update yield')
  }

  const data = await response.json()
  return data.yield || data
}

/**
 * Hook to fetch BOM yield data
 * @param bomId - BOM ID to fetch yield for
 * @returns React Query result with BomYieldResponse
 */
export function useBOMYield(bomId: string) {
  return useQuery<BomYieldResponse, Error>({
    queryKey: bomYieldKeys.detail(bomId),
    queryFn: () => fetchBOMYield(bomId),
    enabled: !!bomId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to update BOM yield settings
 * @returns React Query mutation for updating yield
 */
export function useUpdateBOMYield() {
  const queryClient = useQueryClient()

  return useMutation<BomYieldResponse, Error, YieldUpdateParams>({
    mutationFn: ({ bomId, request }) => updateBOMYield(bomId, request),
    onSuccess: (data, { bomId }) => {
      // Update cache with new yield data
      queryClient.setQueryData(bomYieldKeys.detail(bomId), data)
      // Invalidate BOM detail to refresh yield_percent if updated
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) })
    },
  })
}

/**
 * Calculate theoretical yield from input/output
 */
export function calculateTheoreticalYield(
  inputTotalKg: number,
  outputQtyKg: number
): number {
  if (inputTotalKg <= 0) return 0
  return Math.round((outputQtyKg / inputTotalKg) * 10000) / 100 // 2 decimal places
}

/**
 * Check if variance exceeds threshold
 */
export function hasYieldVarianceWarning(
  expectedYield: number | null,
  actualYield: number | null,
  threshold: number = 5
): boolean {
  if (expectedYield === null || actualYield === null) return false
  const variance = Math.abs(expectedYield - actualYield)
  return variance > threshold
}
