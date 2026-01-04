/**
 * React Hook: LP Detail
 * Story 05.6: LP Detail Page
 *
 * React Query hooks for LP detail operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { LPDetailView } from '@/lib/types/license-plate'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const lpDetailKeys = {
  all: ['lp-detail'] as const,
  detail: (lpId: string) => [...lpDetailKeys.all, lpId] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetches LP detail with all joined data
 */
export function useLPDetail(lpId: string | null) {
  return useQuery({
    queryKey: lpDetailKeys.detail(lpId || ''),
    queryFn: async (): Promise<LPDetailView> => {
      if (!lpId) throw new Error('LP ID is required')

      const response = await fetch(`/api/warehouse/license-plates/${lpId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('LP_NOT_FOUND')
        }
        throw new Error('Failed to fetch LP detail')
      }

      const result = await response.json()
      return result.data || result
    },
    enabled: !!lpId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Block LP mutation
 */
export function useLPBlock(lpId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        throw new Error('Failed to block license plate')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lpDetailKeys.detail(lpId) })
    },
  })
}

/**
 * Unblock LP mutation
 */
export function useLPUnblock(lpId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/unblock`, {
        method: 'PUT',
      })

      if (!response.ok) {
        throw new Error('Failed to unblock license plate')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lpDetailKeys.detail(lpId) })
    },
  })
}
