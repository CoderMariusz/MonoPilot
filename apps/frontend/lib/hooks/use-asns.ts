/**
 * ASN Hooks (Story 05.8)
 * Purpose: React Query hooks for ASN operations
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query'
import type {
  ASN,
  ASNWithDetails,
  ASNListItem,
  ASNFilters,
  CreateASNInput,
  UpdateASNInput,
  CreateASNFromPOInput,
  PaginatedResult,
} from '@/lib/types/asn'

// =============================================================================
// Query Keys
// =============================================================================

export const asnKeys = {
  all: ['asns'] as const,
  lists: () => [...asnKeys.all, 'list'] as const,
  list: (filters: ASNFilters) => [...asnKeys.lists(), { filters }] as const,
  details: () => [...asnKeys.all, 'detail'] as const,
  detail: (id: string) => [...asnKeys.details(), id] as const,
  expectedToday: () => [...asnKeys.all, 'expected-today'] as const,
}

// =============================================================================
// List ASNs Hook
// =============================================================================

export function useASNs(filters: ASNFilters): UseQueryResult<PaginatedResult<ASNListItem>> {
  return useQuery({
    queryKey: asnKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.supplier_id) params.append('supplier_id', filters.supplier_id)
      if (filters.po_id) params.append('po_id', filters.po_id)
      if (filters.date_from) params.append('date_from', filters.date_from)
      if (filters.date_to) params.append('date_to', filters.date_to)
      if (filters.sort) params.append('sort', filters.sort)
      if (filters.order) params.append('order', filters.order)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/warehouse/asns?${params.toString()}`, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch ASNs' }))
        throw new Error(error.message || 'Failed to fetch ASNs')
      }
      return response.json()
    },
    retry: 2,
    staleTime: 30000, // 30 seconds
  })
}

// =============================================================================
// Get Single ASN Hook
// =============================================================================

export function useASN(id: string | null): UseQueryResult<ASNWithDetails> {
  return useQuery({
    queryKey: asnKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('ASN ID is required')
      const response = await fetch(`/api/warehouse/asns/${id}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch ASN')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

// =============================================================================
// Create ASN Hook
// =============================================================================

export function useCreateASN(): UseMutationResult<ASN, Error, CreateASNInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateASNInput) => {
      const response = await fetch('/api/warehouse/asns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create ASN')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: asnKeys.lists() })
      queryClient.invalidateQueries({ queryKey: asnKeys.expectedToday() })
    },
  })
}

// =============================================================================
// Update ASN Hook
// =============================================================================

export function useUpdateASN(): UseMutationResult<ASN, Error, { id: string; data: UpdateASNInput }> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/warehouse/asns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update ASN')
      }

      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: asnKeys.lists() })
      queryClient.invalidateQueries({ queryKey: asnKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: asnKeys.expectedToday() })
    },
  })
}

// =============================================================================
// Delete ASN Hook
// =============================================================================

export function useDeleteASN(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/warehouse/asns/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete ASN')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: asnKeys.lists() })
      queryClient.invalidateQueries({ queryKey: asnKeys.expectedToday() })
    },
  })
}

// =============================================================================
// Cancel ASN Hook
// =============================================================================

export function useCancelASN(): UseMutationResult<ASN, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/warehouse/asns/${id}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to cancel ASN')
      }

      return response.json()
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: asnKeys.lists() })
      queryClient.invalidateQueries({ queryKey: asnKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: asnKeys.expectedToday() })
    },
  })
}

// =============================================================================
// Create ASN from PO Hook
// =============================================================================

export function useCreateASNFromPO(): UseMutationResult<ASNWithDetails, Error, CreateASNFromPOInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateASNFromPOInput) => {
      const response = await fetch(`/api/warehouse/asns/from-po/${data.po_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create ASN from PO')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: asnKeys.lists() })
      queryClient.invalidateQueries({ queryKey: asnKeys.expectedToday() })
    },
  })
}

// =============================================================================
// Get Expected Today ASNs Hook
// =============================================================================

export function useExpectedTodayASNs(): UseQueryResult<ASN[]> {
  return useQuery({
    queryKey: asnKeys.expectedToday(),
    queryFn: async () => {
      const response = await fetch('/api/warehouse/asns/expected-today')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch expected ASNs')
      }
      return response.json()
    },
  })
}

// =============================================================================
// Initiate Receiving Hook
// =============================================================================

export function useInitiateReceiving(): UseMutationResult<{ grn_id: string }, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (asnId: string) => {
      const response = await fetch(`/api/warehouse/asns/${asnId}/receive`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to initiate receiving')
      }

      return response.json()
    },
    onSuccess: (_, asnId) => {
      queryClient.invalidateQueries({ queryKey: asnKeys.detail(asnId) })
      queryClient.invalidateQueries({ queryKey: asnKeys.lists() })
    },
  })
}
