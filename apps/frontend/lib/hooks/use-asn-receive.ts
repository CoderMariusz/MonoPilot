/**
 * ASN Receive Hooks (Story 05.9)
 * Purpose: React Query hooks for ASN receive workflow
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query'
import type {
  ASNReceivePreview,
  ASNReceiveRequest,
  ASNReceiveResult,
} from '@/lib/types/asn'
import { asnKeys } from './use-asns'

// =============================================================================
// Get ASN Receive Preview Hook
// =============================================================================

export function useASNReceivePreview(asnId: string): UseQueryResult<ASNReceivePreview> {
  return useQuery({
    queryKey: ['asn-receive-preview', asnId],
    queryFn: async () => {
      const response = await fetch(`/api/warehouse/asns/${asnId}/receive`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to fetch ASN receive preview')
      }
      return response.json()
    },
    enabled: !!asnId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// =============================================================================
// Execute ASN Receive Hook
// =============================================================================

export function useASNReceive(): UseMutationResult<
  ASNReceiveResult,
  Error,
  { asnId: string; data: ASNReceiveRequest }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ asnId, data }) => {
      const response = await fetch(`/api/warehouse/asns/${asnId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Receive failed')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: asnKeys.detail(variables.asnId) })
      queryClient.invalidateQueries({ queryKey: ['asn-receive-preview', variables.asnId] })
      queryClient.invalidateQueries({ queryKey: asnKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['license-plates'] })
    },
  })
}
