/**
 * useBOMComparison Hook (Story 02.14)
 * React Query hook for comparing two BOM versions
 * FR-2.25: BOM Version Comparison
 */

import { useQuery } from '@tanstack/react-query'
import type { BomComparisonResponse, BomVersionOption } from '@/lib/types/bom-advanced'

// Query keys for cache management
export const bomComparisonKeys = {
  all: ['bom-comparison'] as const,
  compare: (bomId1: string, bomId2: string) => [...bomComparisonKeys.all, bomId1, bomId2] as const,
  versions: (productId: string) => [...bomComparisonKeys.all, 'versions', productId] as const,
}

/**
 * Fetch BOM comparison from API
 */
async function fetchBOMComparison(
  bomId1: string,
  bomId2: string
): Promise<BomComparisonResponse> {
  const response = await fetch(`/api/technical/boms/${bomId1}/compare/${bomId2}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    if (response.status === 400) {
      throw new Error(error.message || 'Cannot compare these BOM versions')
    }
    if (response.status === 404) {
      throw new Error('One or both BOM versions not found')
    }

    throw new Error(error.message || error.error || 'Failed to compare BOMs')
  }

  const data = await response.json()
  return data.comparison || data
}

/**
 * Fetch available BOM versions for a product
 */
async function fetchBOMVersions(productId: string): Promise<BomVersionOption[]> {
  const response = await fetch(`/api/technical/boms?product_id=${productId}&sortBy=version&sortOrder=desc`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to fetch BOM versions')
  }

  const data = await response.json()
  return (data.boms || []).map((bom: any) => ({
    id: bom.id,
    version: bom.version?.toString() || '1',
    status: bom.status,
    effective_from: bom.effective_from,
    effective_to: bom.effective_to,
    output_qty: bom.output_qty,
    output_uom: bom.output_uom,
  }))
}

/**
 * Hook to compare two BOM versions
 * @param bomId1 - First BOM ID (base version)
 * @param bomId2 - Second BOM ID (compare version)
 * @param enabled - Whether to run the query
 * @returns React Query result with BomComparisonResponse
 */
export function useBOMComparison(
  bomId1: string,
  bomId2: string,
  enabled: boolean = true
) {
  return useQuery<BomComparisonResponse, Error>({
    queryKey: bomComparisonKeys.compare(bomId1, bomId2),
    queryFn: () => fetchBOMComparison(bomId1, bomId2),
    enabled: enabled && !!bomId1 && !!bomId2 && bomId1 !== bomId2,
    staleTime: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error.message.includes('Cannot compare') || error.message.includes('not found')) {
        return false
      }
      return failureCount < 2
    },
  })
}

/**
 * Hook to fetch available BOM versions for comparison
 * @param productId - Product ID to fetch versions for
 * @returns React Query result with BomVersionOption[]
 */
export function useBOMVersions(productId: string | null) {
  return useQuery<BomVersionOption[], Error>({
    queryKey: bomComparisonKeys.versions(productId || ''),
    queryFn: () => fetchBOMVersions(productId!),
    enabled: !!productId,
    staleTime: 30 * 1000, // 30 seconds
  })
}
