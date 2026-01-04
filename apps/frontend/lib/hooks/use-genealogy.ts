/**
 * React Hook: LP Genealogy
 * Story 05.2: LP Genealogy Tracking
 *
 * React Query hooks for LP genealogy operations
 */

import { useQuery } from '@tanstack/react-query'
import type { GenealogyTree, GenealogyQueryParams } from '@/lib/types/genealogy'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const genealogyKeys = {
  all: ['genealogy'] as const,
  lpGenealogy: (lpId: string, params?: GenealogyQueryParams) =>
    [...genealogyKeys.all, 'lp', lpId, params] as const,
  forwardTrace: (lpId: string, maxDepth?: number) =>
    [...genealogyKeys.all, 'forward', lpId, maxDepth] as const,
  backwardTrace: (lpId: string, maxDepth?: number) =>
    [...genealogyKeys.all, 'backward', lpId, maxDepth] as const,
  fullTree: (lpId: string, params?: GenealogyQueryParams) =>
    [...genealogyKeys.all, 'tree', lpId, params] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetches genealogy tree for LP detail page (default depth: 3)
 */
export function useLPGenealogy(lpId: string | null, params?: GenealogyQueryParams) {
  return useQuery({
    queryKey: genealogyKeys.lpGenealogy(lpId || '', params),
    queryFn: async (): Promise<GenealogyTree> => {
      if (!lpId) throw new Error('LP ID is required')

      const queryParams = new URLSearchParams()
      if (params?.direction) queryParams.append('direction', params.direction)
      if (params?.maxDepth) queryParams.append('maxDepth', params.maxDepth.toString())
      if (params?.includeReversed !== undefined)
        queryParams.append('includeReversed', params.includeReversed.toString())

      const url = `/api/warehouse/license-plates/${lpId}/genealogy${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 404) {
          // Return empty genealogy for LP not found
          return createEmptyGenealogy(lpId)
        }
        throw new Error('Failed to fetch genealogy')
      }

      const result = await response.json()
      return result.data || result
    },
    enabled: !!lpId,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Fetches forward trace (descendants only)
 */
export function useForwardTrace(
  lpId: string | null,
  maxDepth: number = 10,
  includeReversed: boolean = false
) {
  return useQuery({
    queryKey: genealogyKeys.forwardTrace(lpId || '', maxDepth),
    queryFn: async (): Promise<GenealogyTree> => {
      if (!lpId) throw new Error('LP ID is required')

      const queryParams = new URLSearchParams()
      queryParams.append('maxDepth', maxDepth.toString())
      queryParams.append('includeReversed', includeReversed.toString())

      const url = `/api/warehouse/genealogy/forward-trace/${lpId}?${queryParams.toString()}`
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 404) {
          return createEmptyGenealogy(lpId)
        }
        throw new Error('Failed to fetch forward trace')
      }

      const result = await response.json()
      return result.data || result
    },
    enabled: !!lpId,
    staleTime: 60000,
  })
}

/**
 * Fetches backward trace (ancestors only)
 */
export function useBackwardTrace(
  lpId: string | null,
  maxDepth: number = 10,
  includeReversed: boolean = false
) {
  return useQuery({
    queryKey: genealogyKeys.backwardTrace(lpId || '', maxDepth),
    queryFn: async (): Promise<GenealogyTree> => {
      if (!lpId) throw new Error('LP ID is required')

      const queryParams = new URLSearchParams()
      queryParams.append('maxDepth', maxDepth.toString())
      queryParams.append('includeReversed', includeReversed.toString())

      const url = `/api/warehouse/genealogy/backward-trace/${lpId}?${queryParams.toString()}`
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 404) {
          return createEmptyGenealogy(lpId)
        }
        throw new Error('Failed to fetch backward trace')
      }

      const result = await response.json()
      return result.data || result
    },
    enabled: !!lpId,
    staleTime: 60000,
  })
}

/**
 * Fetches full genealogy tree (both directions)
 */
export function useFullGenealogyTree(lpId: string | null, params?: GenealogyQueryParams) {
  return useQuery({
    queryKey: genealogyKeys.fullTree(lpId || '', params),
    queryFn: async (): Promise<GenealogyTree> => {
      if (!lpId) throw new Error('LP ID is required')

      const queryParams = new URLSearchParams()
      if (params?.direction) queryParams.append('direction', params.direction)
      if (params?.maxDepth) queryParams.append('maxDepth', params.maxDepth.toString())
      if (params?.includeReversed !== undefined)
        queryParams.append('includeReversed', params.includeReversed.toString())

      const url = `/api/warehouse/genealogy/full-tree/${lpId}${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 404) {
          return createEmptyGenealogy(lpId)
        }
        throw new Error('Failed to fetch genealogy tree')
      }

      const result = await response.json()
      return result.data || result
    },
    enabled: !!lpId,
    staleTime: 60000,
  })
}

// ============================================================================
// HELPERS
// ============================================================================

function createEmptyGenealogy(lpId: string): GenealogyTree {
  return {
    lpId,
    lpNumber: '',
    hasGenealogy: false,
    ancestors: [],
    descendants: [],
    summary: {
      originalQuantity: 0,
      splitOutTotal: 0,
      currentQuantity: 0,
      childCount: 0,
      parentCount: 0,
      depth: {
        forward: 0,
        backward: 0,
      },
      totalOperations: 0,
      operationBreakdown: {
        split: 0,
        consume: 0,
        output: 0,
        merge: 0,
      },
    },
    hasMoreLevels: {
      ancestors: false,
      descendants: false,
    },
  }
}
