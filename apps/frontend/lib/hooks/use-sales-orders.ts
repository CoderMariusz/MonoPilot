/**
 * Sales Order Hooks
 * Story 07.2: Sales Orders Core
 *
 * React Query hooks for sales order operations:
 * - useSalesOrders - List with filtering
 * - useSalesOrder - Single order detail
 * - useCreateSalesOrder - Create new order
 * - useUpdateSalesOrder - Update draft order
 * - useDeleteSalesOrder - Delete draft order
 * - useConfirmSalesOrder - Confirm order
 * - useAddSOLine - Add line to order
 * - useUpdateSOLine - Update order line
 * - useDeleteSOLine - Delete order line
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import type { SalesOrder, SalesOrderLine, SOStatus } from '@/lib/services/sales-order-service'

// =============================================================================
// Types
// =============================================================================

export interface SalesOrderListParams {
  page?: number
  limit?: number
  search?: string
  status?: SOStatus | SOStatus[]
  customer_id?: string
  date_from?: string
  date_to?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateSalesOrderRequest {
  customer_id: string
  shipping_address_id?: string
  order_date: string
  required_delivery_date: string
  customer_po?: string
  notes?: string
  lines?: CreateSalesOrderLineRequest[]
}

export interface UpdateSalesOrderRequest {
  customer_id?: string
  shipping_address_id?: string
  order_date?: string
  required_delivery_date?: string
  customer_po?: string
  notes?: string
}

export interface CreateSalesOrderLineRequest {
  product_id: string
  quantity_ordered: number
  unit_price: number
  discount_type?: 'percent' | 'fixed' | null
  discount_value?: number | null
  notes?: string
}

export interface UpdateSalesOrderLineRequest {
  quantity_ordered?: number
  unit_price?: number
  discount_type?: 'percent' | 'fixed' | null
  discount_value?: number | null
  notes?: string
}

// =============================================================================
// Query Keys
// =============================================================================

export const salesOrderKeys = {
  all: ['sales-orders'] as const,
  lists: () => [...salesOrderKeys.all, 'list'] as const,
  list: (params: SalesOrderListParams) => [...salesOrderKeys.lists(), params] as const,
  details: () => [...salesOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...salesOrderKeys.details(), id] as const,
  lines: (soId: string) => [...salesOrderKeys.all, 'lines', soId] as const,
}

// =============================================================================
// API Functions
// =============================================================================

function buildQueryString(params: SalesOrderListParams): string {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())
  if (params.search) searchParams.append('search', params.search)
  if (params.customer_id) searchParams.append('customer_id', params.customer_id)

  if (params.status) {
    const statusStr = Array.isArray(params.status) ? params.status.join(',') : params.status
    searchParams.append('status', statusStr)
  }

  if (params.date_from) searchParams.append('date_from', params.date_from)
  if (params.date_to) searchParams.append('date_to', params.date_to)
  if (params.sort) searchParams.append('sort', params.sort)
  if (params.order) searchParams.append('order', params.order)

  return searchParams.toString()
}

async function fetchSalesOrders(params: SalesOrderListParams): Promise<PaginatedResult<SalesOrder>> {
  const queryString = buildQueryString(params)
  const url = `/api/shipping/sales-orders${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch sales orders')
  }

  const data = await response.json()

  return {
    data: data.data || [],
    pagination: {
      page: data.meta?.page || params.page || 1,
      limit: data.meta?.limit || params.limit || 25,
      total: data.meta?.total || 0,
      totalPages: data.meta?.totalPages || 1,
    },
  }
}

async function fetchSalesOrder(id: string): Promise<SalesOrder> {
  const response = await fetch(`/api/shipping/sales-orders/${id}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch sales order')
  }
  return response.json()
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch paginated sales orders list
 */
export function useSalesOrders(params: SalesOrderListParams = {}): UseQueryResult<PaginatedResult<SalesOrder>> {
  const queryParams: SalesOrderListParams = {
    page: params.page || 1,
    limit: params.limit || 25,
    ...params,
  }

  return useQuery({
    queryKey: salesOrderKeys.list(queryParams),
    queryFn: () => fetchSalesOrders(queryParams),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (prev) => prev,
  })
}

/**
 * Fetch single sales order with lines
 */
export function useSalesOrder(id: string | null): UseQueryResult<SalesOrder> {
  return useQuery({
    queryKey: salesOrderKeys.detail(id || ''),
    queryFn: () => fetchSalesOrder(id!),
    enabled: !!id,
  })
}

/**
 * Create new sales order
 */
export function useCreateSalesOrder(): UseMutationResult<SalesOrder, Error, CreateSalesOrderRequest> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSalesOrderRequest) => {
      const response = await fetch('/api/shipping/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to create sales order')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
    },
  })
}

/**
 * Update sales order
 */
export function useUpdateSalesOrder(): UseMutationResult<SalesOrder, Error, { id: string; data: UpdateSalesOrderRequest }> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/shipping/sales-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to update sales order')
      }

      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(id) })
    },
  })
}

/**
 * Delete sales order
 */
export function useDeleteSalesOrder(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/shipping/sales-orders/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to delete sales order')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
    },
  })
}

/**
 * Confirm sales order
 */
export function useConfirmSalesOrder(): UseMutationResult<SalesOrder, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/shipping/sales-orders/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to confirm sales order')
      }

      const data = await response.json()
      return data.sales_order || data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(id) })
    },
  })
}

/**
 * Hold sales order (Story 07.3)
 * AC-2: Put sales order on hold from draft/confirmed
 */
export interface HoldOrderRequest {
  reason?: string
}

export function useHoldOrder(): UseMutationResult<SalesOrder, Error, { id: string; data?: HoldOrderRequest }> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/shipping/sales-orders/${id}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to hold sales order')
      }

      const result = await response.json()
      return result.sales_order || result
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(id) })
    },
  })
}

/**
 * Cancel sales order (Story 07.3)
 * AC-3: Cancel sales order with required reason
 */
export interface CancelOrderRequest {
  reason: string
}

export function useCancelOrder(): UseMutationResult<SalesOrder, Error, { id: string; data: CancelOrderRequest }> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/shipping/sales-orders/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to cancel sales order')
      }

      const result = await response.json()
      return result.sales_order || result
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(id) })
    },
  })
}

/**
 * Add line to sales order
 */
export function useAddSOLine(soId: string): UseMutationResult<SalesOrderLine, Error, CreateSalesOrderLineRequest> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSalesOrderLineRequest) => {
      const response = await fetch(`/api/shipping/sales-orders/${soId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to add line')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(soId) })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lines(soId) })
    },
  })
}

/**
 * Update sales order line
 */
export function useUpdateSOLine(soId: string, lineId: string): UseMutationResult<SalesOrderLine, Error, UpdateSalesOrderLineRequest> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateSalesOrderLineRequest) => {
      const response = await fetch(`/api/shipping/sales-orders/${soId}/lines/${lineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to update line')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(soId) })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lines(soId) })
    },
  })
}

/**
 * Delete sales order line
 */
export function useDeleteSOLine(soId: string, lineId: string): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/shipping/sales-orders/${soId}/lines/${lineId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to delete line')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(soId) })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lines(soId) })
    },
  })
}

// =============================================================================
// Clone Sales Order Hook (Story 07.5)
// =============================================================================

/**
 * Clone sales order response type
 */
export interface CloneSalesOrderResponse {
  salesOrder: SalesOrder & {
    lines: SalesOrderLine[]
  }
  clonedFrom: string
  message: string
}

/**
 * Clone an existing sales order
 * Creates a new draft order with same customer, products, and quantities
 * Resets status to draft and clears transactional fields
 */
export function useCloneSalesOrder(): UseMutationResult<CloneSalesOrderResponse, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (soId: string) => {
      const response = await fetch(`/api/shipping/sales-orders/${soId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to clone sales order')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
    },
  })
}

// =============================================================================
// Import Sales Orders Hook (Story 07.5)
// =============================================================================

/**
 * Import sales orders response type
 */
export interface ImportSalesOrdersResponse {
  ordersCreated: number
  linesImported: number
  errorsCount: number
  createdOrderNumbers: string[]
  created_orders: Array<{
    id: string
    order_number: string
    customer_code: string
    lines_count: number
  }>
  errors: Array<{
    rowNumber: number
    message: string
  }>
}

/**
 * Import sales orders from CSV file
 * Groups rows by customer and creates one SO per customer
 * Returns summary with success count and errors
 */
export function useImportSalesOrders(): UseMutationResult<ImportSalesOrdersResponse, Error, File> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/shipping/sales-orders/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to import sales orders')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
    },
  })
}

export default useSalesOrders
