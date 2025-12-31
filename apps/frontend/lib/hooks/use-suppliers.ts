/**
 * React Hooks: Suppliers
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * React Query hooks for supplier CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Supplier,
  SupplierSummary,
  SupplierListParams,
  SupplierListResponse,
  CreateSupplierDto,
  UpdateSupplierDto,
  BulkActionResult,
  SupplierProduct,
  SupplierPurchaseOrder,
  SupplierPOSummary,
} from '@/lib/types/supplier'

const SUPPLIERS_QUERY_KEY = 'suppliers'
const SUPPLIER_SUMMARY_KEY = 'supplier-summary'

/**
 * Fetches suppliers with filters, search, and pagination
 */
export function useSuppliers(params: SupplierListParams = {}) {
  return useQuery({
    queryKey: [SUPPLIERS_QUERY_KEY, params],
    queryFn: async (): Promise<SupplierListResponse> => {
      const queryParams = new URLSearchParams()

      if (params.search) queryParams.append('search', params.search)
      if (params.status && params.status !== 'all') {
        queryParams.append('is_active', params.status === 'active' ? 'true' : 'false')
      }
      if (params.currency?.length) {
        params.currency.forEach((c) => queryParams.append('currency[]', c))
      }
      if (params.payment_terms) queryParams.append('payment_terms', params.payment_terms)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sort) queryParams.append('sort', params.sort)
      if (params.order) queryParams.append('order', params.order)

      const url = `/api/planning/suppliers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers')
      }

      const data = await response.json()

      // Transform response to expected format
      return {
        data: data.suppliers || [],
        meta: {
          total: data.total || data.suppliers?.length || 0,
          page: params.page || 1,
          limit: params.limit || 20,
          pages: Math.ceil((data.total || data.suppliers?.length || 0) / (params.limit || 20)),
        },
      }
    },
    staleTime: 30000,
  })
}

/**
 * Fetches supplier summary/KPIs
 */
export function useSupplierSummary() {
  return useQuery({
    queryKey: [SUPPLIER_SUMMARY_KEY],
    queryFn: async (): Promise<SupplierSummary> => {
      const response = await fetch('/api/planning/suppliers/summary')

      if (!response.ok) {
        // If summary endpoint doesn't exist, calculate from list
        const listResponse = await fetch('/api/planning/suppliers')
        if (!listResponse.ok) {
          throw new Error('Failed to fetch supplier summary')
        }

        const data = await listResponse.json()
        const suppliers: Supplier[] = data.suppliers || []

        const total_count = suppliers.length
        const active_count = suppliers.filter((s) => s.is_active).length
        const inactive_count = total_count - active_count

        // Calculate this month count
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const this_month_count = suppliers.filter(
          (s) => new Date(s.created_at) >= firstDayOfMonth
        ).length

        return {
          total_count,
          active_count,
          inactive_count,
          active_rate: total_count > 0 ? Math.round((active_count / total_count) * 10000) / 100 : 0,
          this_month_count,
        }
      }

      const data = await response.json()
      return data.data || data
    },
    staleTime: 60000, // 1 minute
  })
}

/**
 * Fetches a single supplier by ID
 */
export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: [SUPPLIERS_QUERY_KEY, id],
    queryFn: async (): Promise<Supplier | null> => {
      if (!id) return null

      const response = await fetch(`/api/planning/suppliers/${id}`)

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch supplier')
      }

      const data = await response.json()
      return data.supplier || data
    },
    enabled: !!id,
    staleTime: 30000,
  })
}

/**
 * Creates a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSupplierDto): Promise<Supplier> => {
      const response = await fetch('/api/planning/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create supplier')
      }

      const data = await response.json()
      return data.supplier || data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [SUPPLIER_SUMMARY_KEY] })
    },
  })
}

/**
 * Updates an existing supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierDto }): Promise<Supplier> => {
      const response = await fetch(`/api/planning/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update supplier')
      }

      const result = await response.json()
      return result.supplier || result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: [SUPPLIER_SUMMARY_KEY] })
    },
  })
}

/**
 * Deletes a supplier
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/planning/suppliers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete supplier')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [SUPPLIER_SUMMARY_KEY] })
    },
  })
}

/**
 * Deactivates a supplier
 */
export function useDeactivateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }): Promise<Supplier> => {
      const response = await fetch(`/api/planning/suppliers/${id}/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to deactivate supplier')
      }

      const data = await response.json()
      return data.supplier || data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: [SUPPLIER_SUMMARY_KEY] })
    },
  })
}

/**
 * Activates a supplier
 */
export function useActivateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Supplier> => {
      const response = await fetch(`/api/planning/suppliers/${id}/activate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to activate supplier')
      }

      const data = await response.json()
      return data.supplier || data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY, id] })
      queryClient.invalidateQueries({ queryKey: [SUPPLIER_SUMMARY_KEY] })
    },
  })
}

/**
 * Bulk deactivates suppliers
 */
export function useBulkDeactivateSuppliers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ids,
      reason,
    }: {
      ids: string[]
      reason?: string
    }): Promise<BulkActionResult> => {
      const response = await fetch('/api/planning/suppliers/bulk-deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_ids: ids, reason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to bulk deactivate suppliers')
      }

      const data = await response.json()
      return data.data || data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [SUPPLIER_SUMMARY_KEY] })
    },
  })
}

/**
 * Bulk activates suppliers
 */
export function useBulkActivateSuppliers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]): Promise<BulkActionResult> => {
      const response = await fetch('/api/planning/suppliers/bulk-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_ids: ids }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to bulk activate suppliers')
      }

      const data = await response.json()
      return data.data || data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUPPLIERS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [SUPPLIER_SUMMARY_KEY] })
    },
  })
}

/**
 * Gets the next available supplier code
 */
export function useNextSupplierCode() {
  return useQuery({
    queryKey: [SUPPLIERS_QUERY_KEY, 'next-code'],
    queryFn: async (): Promise<string> => {
      const response = await fetch('/api/planning/suppliers/next-code')

      if (!response.ok) {
        // Fallback: calculate from list
        const listResponse = await fetch('/api/planning/suppliers')
        if (listResponse.ok) {
          const data = await listResponse.json()
          const suppliers: Supplier[] = data.suppliers || []
          const maxNum = suppliers.reduce((max, s) => {
            const match = s.code.match(/SUP-(\d+)/)
            if (match) {
              return Math.max(max, parseInt(match[1], 10))
            }
            return max
          }, 0)
          return `SUP-${String(maxNum + 1).padStart(3, '0')}`
        }
        return 'SUP-001'
      }

      const data = await response.json()
      return data.code || data.next_code || 'SUP-001'
    },
    staleTime: 0, // Always fetch fresh
  })
}

/**
 * Validates supplier code uniqueness
 */
export function useValidateSupplierCode(code: string, excludeId?: string) {
  return useQuery({
    queryKey: [SUPPLIERS_QUERY_KEY, 'validate-code', code, excludeId],
    queryFn: async (): Promise<boolean> => {
      if (!code) return true

      const queryParams = new URLSearchParams()
      queryParams.append('code', code)
      if (excludeId) queryParams.append('exclude_id', excludeId)

      const response = await fetch(`/api/planning/suppliers/validate-code?${queryParams.toString()}`)

      if (!response.ok) {
        // Fallback: check from list
        const listResponse = await fetch('/api/planning/suppliers')
        if (listResponse.ok) {
          const data = await listResponse.json()
          const suppliers: Supplier[] = data.suppliers || []
          const exists = suppliers.some((s) => s.code === code && s.id !== excludeId)
          return !exists // Return true if valid (doesn't exist)
        }
        throw new Error('Failed to validate supplier code')
      }

      const data = await response.json()
      return data.valid || data.available || !data.exists
    },
    enabled: false, // Manual trigger only
    staleTime: 0,
  })
}

/**
 * Fetches supplier products
 */
export function useSupplierProducts(supplierId: string | null) {
  return useQuery({
    queryKey: [SUPPLIERS_QUERY_KEY, supplierId, 'products'],
    queryFn: async (): Promise<SupplierProduct[]> => {
      if (!supplierId) return []

      const response = await fetch(`/api/planning/suppliers/${supplierId}/products`)

      if (!response.ok) {
        throw new Error('Failed to fetch supplier products')
      }

      const data = await response.json()
      return data.supplier_products || data.data || []
    },
    enabled: !!supplierId,
    staleTime: 30000,
  })
}

/**
 * Fetches supplier purchase orders
 */
export function useSupplierPurchaseOrders(
  supplierId: string | null,
  params: { status?: string; date_range?: string; limit?: number; offset?: number } = {}
) {
  return useQuery({
    queryKey: [SUPPLIERS_QUERY_KEY, supplierId, 'purchase-orders', params],
    queryFn: async (): Promise<{
      data: SupplierPurchaseOrder[]
      meta: { total: number; limit: number; offset: number; has_more: boolean }
      summary: SupplierPOSummary
    }> => {
      if (!supplierId) {
        return {
          data: [],
          meta: { total: 0, limit: 10, offset: 0, has_more: false },
          summary: {
            total_orders: 0,
            total_value: 0,
            currency: 'PLN',
            avg_lead_time_days: 0,
            on_time_delivery_percent: 0,
            quality_rating: null,
            open_pos: 0,
          },
        }
      }

      const queryParams = new URLSearchParams()
      if (params.status) queryParams.append('status', params.status)
      if (params.date_range) queryParams.append('date_range', params.date_range)
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.offset) queryParams.append('offset', params.offset.toString())

      const response = await fetch(
        `/api/planning/suppliers/${supplierId}/purchase-orders?${queryParams.toString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch supplier purchase orders')
      }

      return response.json()
    },
    enabled: !!supplierId,
    staleTime: 30000,
  })
}

/**
 * Exports suppliers to Excel
 */
export function useExportSuppliers() {
  return useMutation({
    mutationFn: async ({
      supplierIds,
      includeProducts,
    }: {
      supplierIds: string[]
      includeProducts?: boolean
    }): Promise<Blob> => {
      const response = await fetch('/api/planning/suppliers/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_ids: supplierIds,
          format: 'xlsx',
          include_products: includeProducts ?? true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export suppliers')
      }

      return response.blob()
    },
  })
}
