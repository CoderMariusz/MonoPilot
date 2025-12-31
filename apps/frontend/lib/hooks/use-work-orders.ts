/**
 * React Query Hook: useWorkOrders
 * Story 03.10: Work Order CRUD - List Query
 *
 * Fetches paginated work orders with filtering, sorting, and search
 */

import { useQuery } from '@tanstack/react-query'
import type { WOListParams, PaginatedWOResult, WOListItem } from '@/lib/types/work-order'

// Query keys for cache management
export const workOrderKeys = {
  all: ['work-orders'] as const,
  lists: () => [...workOrderKeys.all, 'list'] as const,
  list: (params: WOListParams) => [...workOrderKeys.lists(), params] as const,
  details: () => [...workOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...workOrderKeys.details(), id] as const,
  summary: () => [...workOrderKeys.all, 'summary'] as const,
  statusHistory: (id: string) => [...workOrderKeys.all, 'history', id] as const,
  bomForDate: (productId: string, date: string) =>
    [...workOrderKeys.all, 'bom-for-date', productId, date] as const,
  availableBoms: (productId: string) =>
    [...workOrderKeys.all, 'available-boms', productId] as const,
}

/**
 * Build query string from params
 */
function buildQueryString(params: WOListParams): string {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())
  if (params.search && params.search.length >= 2) {
    searchParams.append('search', params.search)
  }
  if (params.product_id) searchParams.append('product_id', params.product_id)

  // Handle status (can be string or array)
  if (params.status) {
    const statusStr = Array.isArray(params.status)
      ? params.status.join(',')
      : params.status
    searchParams.append('status', statusStr)
  }

  if (params.line_id) searchParams.append('line_id', params.line_id)
  if (params.machine_id) searchParams.append('machine_id', params.machine_id)
  if (params.priority) searchParams.append('priority', params.priority)
  if (params.date_from) searchParams.append('date_from', params.date_from)
  if (params.date_to) searchParams.append('date_to', params.date_to)
  if (params.sort) searchParams.append('sort', params.sort)
  if (params.order) searchParams.append('order', params.order)

  return searchParams.toString()
}

/**
 * Fetch work orders list from API
 */
async function fetchWorkOrders(params: WOListParams): Promise<PaginatedWOResult> {
  const queryString = buildQueryString(params)
  const url = `/api/planning/work-orders${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch work orders')
  }

  const data = await response.json()

  // Transform API response to expected format
  const items: WOListItem[] = (data.data || []).map((wo: any) => ({
    id: wo.id,
    wo_number: wo.wo_number,
    product_id: wo.product?.id || wo.product_id || '',
    product_code: wo.product_code || wo.product?.code || '',
    product_name: wo.product_name || wo.product?.name || '',
    planned_quantity: wo.planned_quantity,
    produced_quantity: wo.produced_quantity || 0,
    uom: wo.uom,
    status: wo.status,
    planned_start_date: wo.planned_start_date,
    production_line_id: wo.production_line?.id || wo.production_line_id || null,
    production_line_name: wo.production_line_name || wo.production_line?.name || null,
    priority: wo.priority || 'normal',
    bom_id: wo.bom?.id || wo.bom_id || null,
    created_at: wo.created_at,
  }))

  return {
    data: items,
    pagination: {
      page: data.meta?.page || params.page || 1,
      limit: data.meta?.limit || params.limit || 20,
      total: data.meta?.total || 0,
      totalPages: data.meta?.totalPages || Math.ceil((data.meta?.total || 0) / (params.limit || 20)),
    },
  }
}

/**
 * Hook to fetch paginated work orders with filtering
 */
export function useWorkOrders(params: WOListParams = {}) {
  const queryParams = {
    page: params.page || 1,
    limit: params.limit || 20,
    ...params,
  }

  return useQuery({
    queryKey: workOrderKeys.list(queryParams),
    queryFn: () => fetchWorkOrders(queryParams),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData,
  })
}

export default useWorkOrders
