/**
 * React Hooks: Purchase Orders
 * Story: 03.3 - PO CRUD + Lines
 *
 * React Query hooks for purchase order CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  PurchaseOrderWithLines,
  POListItem,
  POLine,
  POSummary,
  POListParams,
  PaginatedPOResult,
  CreatePOInput,
  UpdatePOInput,
  CreatePOLineInput,
  UpdatePOLineInput,
  PriceInfo,
  SupplierDefaults,
} from '@/lib/types/purchase-order'
import type { POStatusHistory } from '@/lib/services/purchase-order-service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  list: (params: POListParams) => [...purchaseOrderKeys.lists(), params] as const,
  details: () => [...purchaseOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseOrderKeys.details(), id] as const,
  summary: () => [...purchaseOrderKeys.all, 'summary'] as const,
  history: (id: string) => [...purchaseOrderKeys.all, 'history', id] as const,
  lines: (id: string) => [...purchaseOrderKeys.all, 'lines', id] as const,
  supplierPrice: (supplierId: string, productId: string) =>
    [...purchaseOrderKeys.all, 'supplier-price', supplierId, productId] as const,
  supplierDefaults: (supplierId: string) =>
    [...purchaseOrderKeys.all, 'supplier-defaults', supplierId] as const,
}

// ============================================================================
// LIST QUERIES
// ============================================================================

/**
 * Fetches purchase orders with pagination and filters
 */
export function usePurchaseOrders(params: POListParams = {}) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: async (): Promise<PaginatedPOResult> => {
      const queryParams = new URLSearchParams()

      if (params.search) queryParams.append('search', params.search)
      if (params.status) {
        const statuses = Array.isArray(params.status) ? params.status : [params.status]
        statuses.forEach((s) => queryParams.append('status[]', s))
      }
      if (params.supplier_id) queryParams.append('supplier_id', params.supplier_id)
      if (params.warehouse_id) queryParams.append('warehouse_id', params.warehouse_id)
      if (params.from_date) queryParams.append('from_date', params.from_date)
      if (params.to_date) queryParams.append('to_date', params.to_date)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sort) queryParams.append('sort', params.sort)
      if (params.order) queryParams.append('order', params.order)

      const url = `/api/planning/purchase-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch purchase orders')
      }

      const data = await response.json()

      return {
        data: data.data || data.purchase_orders || [],
        meta: data.meta || {
          total: data.total || 0,
          page: params.page || 1,
          limit: params.limit || 20,
          pages: Math.ceil((data.total || 0) / (params.limit || 20)),
        },
      }
    },
    staleTime: 30000,
  })
}

/**
 * Fetches KPI summary for purchase orders
 */
export function usePOSummary() {
  return useQuery({
    queryKey: purchaseOrderKeys.summary(),
    queryFn: async (): Promise<POSummary> => {
      const response = await fetch('/api/planning/purchase-orders/summary')

      if (!response.ok) {
        // Return defaults on error
        return {
          open_count: 0,
          open_total: 0,
          pending_approval_count: 0,
          overdue_count: 0,
          this_month_total: 0,
          this_month_count: 0,
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
 * Fetches a single purchase order with lines
 */
export function usePurchaseOrder(id: string | null) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id || ''),
    queryFn: async (): Promise<PurchaseOrderWithLines | null> => {
      if (!id) return null

      const response = await fetch(`/api/planning/purchase-orders/${id}`)

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch purchase order')
      }

      const data = await response.json()
      return data.data || data.purchase_order || data
    },
    enabled: !!id,
    staleTime: 30000,
  })
}

/**
 * Fetches status history for a purchase order
 */
export function usePOStatusHistory(poId: string | null) {
  return useQuery({
    queryKey: purchaseOrderKeys.history(poId || ''),
    queryFn: async (): Promise<POStatusHistory[]> => {
      if (!poId) return []

      const response = await fetch(`/api/planning/purchase-orders/${poId}/history`)

      if (!response.ok) {
        throw new Error('Failed to fetch purchase order history')
      }

      const data = await response.json()
      return data.data || data.history || []
    },
    enabled: !!poId,
    staleTime: 60000,
  })
}

// ============================================================================
// SUPPLIER QUERIES
// ============================================================================

/**
 * Gets supplier-specific price for a product
 */
export function useSupplierProductPrice(supplierId: string | null, productId: string | null) {
  return useQuery({
    queryKey: purchaseOrderKeys.supplierPrice(supplierId || '', productId || ''),
    queryFn: async (): Promise<PriceInfo | null> => {
      if (!supplierId || !productId) return null

      const response = await fetch(
        `/api/planning/suppliers/${supplierId}/products/${productId}`
      )

      if (!response.ok) {
        if (response.status === 404) {
          // No supplier-specific price, return null to fall back to std_price
          return null
        }
        throw new Error('Failed to fetch supplier product price')
      }

      const data = await response.json()
      const supplierProduct = data.data || data

      if (!supplierProduct?.unit_price) {
        return null
      }

      return {
        price: supplierProduct.unit_price,
        source: 'supplier',
        supplier_product_code: supplierProduct.supplier_product_code,
        lead_time_days: supplierProduct.lead_time_days,
        moq: supplierProduct.moq,
      }
    },
    enabled: !!supplierId && !!productId,
    staleTime: 60000,
  })
}

/**
 * Gets supplier defaults for cascade
 */
export function useSupplierDefaults(supplierId: string | null) {
  return useQuery({
    queryKey: purchaseOrderKeys.supplierDefaults(supplierId || ''),
    queryFn: async (): Promise<SupplierDefaults | null> => {
      if (!supplierId) return null

      const response = await fetch(`/api/planning/suppliers/${supplierId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch supplier')
      }

      const data = await response.json()
      const supplier = data.data || data.supplier || data

      return {
        currency: supplier.currency,
        tax_code_id: supplier.tax_code_id,
        payment_terms: supplier.payment_terms,
        lead_time_days: supplier.lead_time_days,
      }
    },
    enabled: !!supplierId,
    staleTime: 60000,
  })
}

// ============================================================================
// CRUD MUTATIONS
// ============================================================================

/**
 * Creates a new purchase order
 */
export function useCreatePO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePOInput): Promise<PurchaseOrderWithLines> => {
      const response = await fetch('/api/planning/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to create purchase order')
      }

      const data = await response.json()
      return data.data || data.purchase_order || data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

/**
 * Updates an existing purchase order
 */
export function useUpdatePO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdatePOInput
    }): Promise<PurchaseOrderWithLines> => {
      const response = await fetch(`/api/planning/purchase-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to update purchase order')
      }

      const result = await response.json()
      return result.data || result.purchase_order || result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

/**
 * Deletes a purchase order
 */
export function useDeletePO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/planning/purchase-orders/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to delete purchase order')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

// ============================================================================
// STATUS MUTATIONS
// ============================================================================

/**
 * Submits a purchase order
 */
export function useSubmitPO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<PurchaseOrderWithLines> => {
      const response = await fetch(`/api/planning/purchase-orders/${id}/submit`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to submit purchase order')
      }

      const data = await response.json()
      return data.data || data.purchase_order || data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.history(id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

/**
 * Confirms a purchase order
 */
export function useConfirmPO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<PurchaseOrderWithLines> => {
      const response = await fetch(`/api/planning/purchase-orders/${id}/confirm`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to confirm purchase order')
      }

      const data = await response.json()
      return data.data || data.purchase_order || data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.history(id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

/**
 * Cancels a purchase order
 */
export function useCancelPO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string
      reason?: string
    }): Promise<PurchaseOrderWithLines> => {
      const response = await fetch(`/api/planning/purchase-orders/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to cancel purchase order')
      }

      const data = await response.json()
      return data.data || data.purchase_order || data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.history(variables.id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

// ============================================================================
// LINE MUTATIONS
// ============================================================================

/**
 * Adds a line to a purchase order
 */
export function useAddPOLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      poId,
      line,
    }: {
      poId: string
      line: CreatePOLineInput
    }): Promise<POLine> => {
      const response = await fetch(`/api/planning/purchase-orders/${poId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(line),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to add line')
      }

      const data = await response.json()
      return data.data || data.line || data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.poId) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lines(variables.poId) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

/**
 * Updates a line in a purchase order
 */
export function useUpdatePOLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      poId,
      lineId,
      data,
    }: {
      poId: string
      lineId: string
      data: UpdatePOLineInput
    }): Promise<POLine> => {
      const response = await fetch(
        `/api/planning/purchase-orders/${poId}/lines/${lineId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to update line')
      }

      const result = await response.json()
      return result.data || result.line || result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.poId) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lines(variables.poId) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

/**
 * Deletes a line from a purchase order
 */
export function useDeletePOLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      poId,
      lineId,
    }: {
      poId: string
      lineId: string
    }): Promise<void> => {
      const response = await fetch(
        `/api/planning/purchase-orders/${poId}/lines/${lineId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to delete line')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.poId) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lines(variables.poId) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

// ============================================================================
// APPROVAL MUTATIONS
// ============================================================================

/**
 * Approves a purchase order
 */
export function useApprovePO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      comments,
    }: {
      id: string
      comments?: string
    }): Promise<PurchaseOrderWithLines> => {
      const response = await fetch(`/api/planning/purchase-orders/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to approve purchase order')
      }

      const data = await response.json()
      return data.data || data.purchase_order || data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.history(variables.id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

/**
 * Rejects a purchase order
 */
export function useRejectPO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      reason,
      comments,
    }: {
      id: string
      reason: string
      comments?: string
    }): Promise<PurchaseOrderWithLines> => {
      const response = await fetch(`/api/planning/purchase-orders/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason, comments }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to reject purchase order')
      }

      const data = await response.json()
      return data.data || data.purchase_order || data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.history(variables.id) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}
