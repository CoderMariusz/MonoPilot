/**
 * React Hooks: License Plates
 * Story: 05.1 - LP Table + CRUD
 *
 * React Query hooks for license plate operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  LicensePlate,
  LPListItem,
  LPSummary,
  LPFilterParams,
  PaginatedLPResult,
  CreateLPInput,
  UpdateLPInput,
  BlockLPInput,
  UpdateQAStatusInput,
} from '@/lib/types/license-plate'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const licensePlateKeys = {
  all: ['license-plates'] as const,
  lists: () => [...licensePlateKeys.all, 'list'] as const,
  list: (params: LPFilterParams) => [...licensePlateKeys.lists(), params] as const,
  details: () => [...licensePlateKeys.all, 'detail'] as const,
  detail: (id: string) => [...licensePlateKeys.details(), id] as const,
  summary: () => [...licensePlateKeys.all, 'summary'] as const,
}

// ============================================================================
// LIST QUERIES
// ============================================================================

/**
 * Fetches license plates with pagination and filters
 */
export function useLicensePlates(params: LPFilterParams = {}) {
  return useQuery({
    queryKey: licensePlateKeys.list(params),
    queryFn: async (): Promise<PaginatedLPResult> => {
      const queryParams = new URLSearchParams()

      if (params.search) queryParams.append('search', params.search)
      if (params.status) {
        const statuses = Array.isArray(params.status) ? params.status : [params.status]
        statuses.forEach((s) => queryParams.append('status[]', s))
      }
      if (params.qa_status) {
        const qaStatuses = Array.isArray(params.qa_status) ? params.qa_status : [params.qa_status]
        qaStatuses.forEach((s) => queryParams.append('qa_status[]', s))
      }
      if (params.warehouse_id) queryParams.append('warehouse_id', params.warehouse_id)
      if (params.location_id) queryParams.append('location_id', params.location_id)
      if (params.product_id) queryParams.append('product_id', params.product_id)
      if (params.expiry_before) queryParams.append('expiry_before', params.expiry_before)
      if (params.expiry_after) queryParams.append('expiry_after', params.expiry_after)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sort) queryParams.append('sort', params.sort)
      if (params.order) queryParams.append('order', params.order)

      const url = `/api/warehouse/license-plates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch license plates')
      }

      const data = await response.json()

      return {
        data: data.data || data.license_plates || [],
        meta: data.meta || {
          total: data.total || 0,
          page: params.page || 1,
          limit: params.limit || 50,
          pages: Math.ceil((data.total || 0) / (params.limit || 50)),
        },
      }
    },
    staleTime: 30000,
  })
}

/**
 * Fetches KPI summary for license plates
 */
export function useLPSummary() {
  return useQuery({
    queryKey: licensePlateKeys.summary(),
    queryFn: async (): Promise<LPSummary> => {
      const response = await fetch('/api/warehouse/license-plates/summary')

      if (!response.ok) {
        // Return defaults on error
        return {
          total_count: 0,
          total_quantity: 0,
          available_count: 0,
          available_percentage: 0,
          reserved_count: 0,
          reserved_percentage: 0,
          consumed_count: 0,
          blocked_count: 0,
          expiring_soon_count: 0,
          expiring_critical_count: 0,
          expired_count: 0,
        }
      }

      const data = await response.json()
      return data.data || data
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  })
}

// ============================================================================
// DETAIL QUERIES
// ============================================================================

/**
 * Fetches a single license plate
 */
export function useLicensePlate(id: string | null) {
  return useQuery({
    queryKey: licensePlateKeys.detail(id || ''),
    queryFn: async (): Promise<LicensePlate | null> => {
      if (!id) return null

      const response = await fetch(`/api/warehouse/license-plates/${id}`)

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch license plate')
      }

      const data = await response.json()
      return data.data || data.license_plate || data
    },
    enabled: !!id,
    staleTime: 30000,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Creates a new license plate
 */
export function useCreateLP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateLPInput): Promise<LicensePlate> => {
      const response = await fetch('/api/warehouse/license-plates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create license plate')
      }

      const data = await response.json()
      return data.data || data.license_plate || data
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.summary() })
    },
  })
}

/**
 * Updates a license plate
 */
export function useUpdateLP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateLPInput }): Promise<LicensePlate> => {
      const response = await fetch(`/api/warehouse/license-plates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update license plate')
      }

      const data = await response.json()
      return data.data || data.license_plate || data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.summary() })
    },
  })
}

/**
 * Blocks a license plate
 */
export function useBlockLP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BlockLPInput }): Promise<LicensePlate> => {
      const response = await fetch(`/api/warehouse/license-plates/${id}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to block license plate')
      }

      const data = await response.json()
      return data.data || data.license_plate || data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.summary() })
    },
  })
}

/**
 * Unblocks a license plate
 */
export function useUnblockLP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<LicensePlate> => {
      const response = await fetch(`/api/warehouse/license-plates/${id}/unblock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to unblock license plate')
      }

      const data = await response.json()
      return data.data || data.license_plate || data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.summary() })
    },
  })
}

/**
 * Updates QA status
 */
export function useUpdateQAStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateQAStatusInput }): Promise<LicensePlate> => {
      const response = await fetch(`/api/warehouse/license-plates/${id}/qa-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update QA status')
      }

      const data = await response.json()
      return data.data || data.license_plate || data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.summary() })
    },
  })
}

/**
 * Generates a new LP number
 */
export function useGenerateLPNumber() {
  return useMutation({
    mutationFn: async (): Promise<{ lp_number: string }> => {
      const response = await fetch('/api/warehouse/license-plates/generate-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate LP number')
      }

      const data = await response.json()
      return data.data || data
    },
  })
}
