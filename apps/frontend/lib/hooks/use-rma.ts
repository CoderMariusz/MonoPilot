/**
 * React Hooks: RMA (Return Merchandise Authorization)
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * React Query hooks for RMA CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RMAFormInput, RMAUpdateInput, RMAListParams, RMAStatus, RMAReasonCode, RMADisposition } from '@/lib/validation/rma-schemas'

const RMA_QUERY_KEY = 'rma'

// Types
export interface RMALineItem {
  id: string
  product_id: string
  product_code: string
  product_name: string
  quantity_expected: number
  quantity_received: number
  lot_number: string | null
  reason_notes: string | null
  disposition: RMADisposition | null
  created_at: string
}

export interface RMAListItem {
  id: string
  rma_number: string
  customer_id: string
  customer_name: string
  sales_order_id: string | null
  sales_order_number: string | null
  status: RMAStatus
  reason_code: RMAReasonCode
  disposition: RMADisposition | null
  line_count: number
  total_value: number | null
  notes: string | null
  created_at: string
  created_by: string | null
  created_by_name: string | null
  approved_at: string | null
  approved_by: string | null
  approved_by_name: string | null
}

export interface RMADetail extends RMAListItem {
  lines: RMALineItem[]
}

export interface RMAListResponse {
  rmas: RMAListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: {
    pending_count: number
    approved_count: number
    total_count: number
  }
}

export interface RMADetailResponse {
  rma: RMADetail
  permissions: {
    can_edit: boolean
    can_delete: boolean
    can_approve: boolean
    can_close: boolean
  }
}

/**
 * Fetches RMAs with filters, search, and pagination
 */
export function useRMAs(params: RMAListParams = {}) {
  return useQuery({
    queryKey: [RMA_QUERY_KEY, 'list', params],
    queryFn: async (): Promise<RMAListResponse> => {
      const queryParams = new URLSearchParams()

      if (params.search) queryParams.append('search', params.search)
      if (params.status) queryParams.append('status', params.status)
      if (params.reason_code) queryParams.append('reason_code', params.reason_code)
      if (params.customer_id) queryParams.append('customer_id', params.customer_id)
      if (params.date_from) queryParams.append('date_from', params.date_from)
      if (params.date_to) queryParams.append('date_to', params.date_to)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)

      const url = `/api/shipping/rma${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch RMAs')
      }

      return response.json()
    },
    staleTime: 30000,
  })
}

/**
 * Fetches a single RMA by ID with lines and permissions
 */
export function useRMA(id: string | null) {
  return useQuery({
    queryKey: [RMA_QUERY_KEY, 'detail', id],
    queryFn: async (): Promise<RMADetailResponse | null> => {
      if (!id) return null

      const response = await fetch(`/api/shipping/rma/${id}`)

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch RMA')
      }

      return response.json()
    },
    enabled: !!id,
    staleTime: 30000,
  })
}

/**
 * Creates a new RMA with lines
 */
export function useCreateRMA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RMAFormInput): Promise<RMADetail> => {
      const response = await fetch('/api/shipping/rma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || error.message || 'Failed to create RMA')
      }

      const data = await response.json()
      return data.rma
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RMA_QUERY_KEY] })
    },
  })
}

/**
 * Updates an existing RMA (pending status only)
 */
export function useUpdateRMA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RMAUpdateInput }): Promise<RMADetail> => {
      const response = await fetch(`/api/shipping/rma/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || error.message || 'Failed to update RMA')
      }

      const result = await response.json()
      return result.rma
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RMA_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [RMA_QUERY_KEY, 'detail', variables.id] })
    },
  })
}

/**
 * Deletes an RMA (pending status only)
 */
export function useDeleteRMA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/shipping/rma/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || error.message || 'Failed to delete RMA')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RMA_QUERY_KEY] })
    },
  })
}

/**
 * Adds a line to an RMA
 */
export function useAddRMALine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      rmaId,
      data,
    }: {
      rmaId: string
      data: {
        product_id: string
        quantity_expected: number
        lot_number?: string | null
        reason_notes?: string | null
        disposition?: RMADisposition | null
      }
    }): Promise<RMALineItem> => {
      const response = await fetch(`/api/shipping/rma/${rmaId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || error.message || 'Failed to add line')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RMA_QUERY_KEY, 'detail', variables.rmaId] })
    },
  })
}

/**
 * Updates an RMA line
 */
export function useUpdateRMALine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      rmaId,
      lineId,
      data,
    }: {
      rmaId: string
      lineId: string
      data: {
        quantity_expected?: number
        lot_number?: string | null
        reason_notes?: string | null
        disposition?: RMADisposition | null
      }
    }): Promise<RMALineItem> => {
      const response = await fetch(`/api/shipping/rma/${rmaId}/lines/${lineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || error.message || 'Failed to update line')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RMA_QUERY_KEY, 'detail', variables.rmaId] })
    },
  })
}

/**
 * Deletes an RMA line
 */
export function useDeleteRMALine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ rmaId, lineId }: { rmaId: string; lineId: string }): Promise<void> => {
      const response = await fetch(`/api/shipping/rma/${rmaId}/lines/${lineId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || error.message || 'Failed to delete line')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RMA_QUERY_KEY, 'detail', variables.rmaId] })
    },
  })
}

/**
 * Approves an RMA (Manager+ only)
 */
export function useApproveRMA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<RMADetail> => {
      const response = await fetch(`/api/shipping/rma/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || error.message || 'Failed to approve RMA')
      }

      const data = await response.json()
      return data.rma
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [RMA_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [RMA_QUERY_KEY, 'detail', id] })
    },
  })
}

/**
 * Closes an RMA (Manager+ only)
 */
export function useCloseRMA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<RMADetail> => {
      const response = await fetch(`/api/shipping/rma/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || error.message || 'Failed to close RMA')
      }

      const data = await response.json()
      return data.rma
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [RMA_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [RMA_QUERY_KEY, 'detail', id] })
    },
  })
}
