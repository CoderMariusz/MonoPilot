/**
 * React Query Hook: useTransferOrders
 * Story 03.8: Transfer Orders CRUD + Lines
 *
 * Fetches paginated transfer orders with filtering, sorting, and search
 */

import { useQuery } from '@tanstack/react-query'
import type {
  TOListParams,
  PaginatedTOResult,
  TransferOrderWithWarehouses,
  TOStatus,
} from '@/lib/types/transfer-order'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const transferOrderKeys = {
  all: ['transfer-orders'] as const,
  lists: () => [...transferOrderKeys.all, 'list'] as const,
  list: (params: TOListParams) => [...transferOrderKeys.lists(), params] as const,
  details: () => [...transferOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...transferOrderKeys.details(), id] as const,
  summary: () => [...transferOrderKeys.all, 'summary'] as const,
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Build query string from params
 */
function buildQueryString(params: TOListParams): string {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())
  if (params.search && params.search.length >= 2) {
    searchParams.append('search', params.search)
  }

  // Handle status (can be string or array)
  if (params.status) {
    const statusStr = Array.isArray(params.status)
      ? params.status.join(',')
      : params.status
    searchParams.append('status', statusStr)
  }

  if (params.from_warehouse_id) {
    searchParams.append('from_warehouse_id', params.from_warehouse_id)
  }
  if (params.to_warehouse_id) {
    searchParams.append('to_warehouse_id', params.to_warehouse_id)
  }
  if (params.priority) searchParams.append('priority', params.priority)
  if (params.sort) searchParams.append('sort_by', params.sort)
  if (params.order) searchParams.append('sort_direction', params.order)

  return searchParams.toString()
}

/**
 * Fetch transfer orders list from API
 */
async function fetchTransferOrders(params: TOListParams): Promise<PaginatedTOResult> {
  const queryString = buildQueryString(params)
  const url = `/api/planning/transfer-orders${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch transfer orders')
  }

  const data = await response.json()

  // Transform API response to expected format
  const items: TransferOrderWithWarehouses[] = (data.transfer_orders || data.data || []).map(
    (to: any) => ({
      id: to.id,
      org_id: to.org_id,
      to_number: to.to_number,
      from_warehouse_id: to.from_warehouse_id,
      to_warehouse_id: to.to_warehouse_id,
      planned_ship_date: to.planned_ship_date,
      planned_receive_date: to.planned_receive_date,
      actual_ship_date: to.actual_ship_date,
      actual_receive_date: to.actual_receive_date,
      status: to.status as TOStatus,
      priority: to.priority || 'normal',
      notes: to.notes,
      shipped_by: to.shipped_by,
      received_by: to.received_by,
      created_at: to.created_at,
      updated_at: to.updated_at,
      created_by: to.created_by,
      updated_by: to.updated_by,
      from_warehouse: to.from_warehouse || {
        id: to.from_warehouse_id,
        code: '',
        name: 'Unknown',
      },
      to_warehouse: to.to_warehouse || {
        id: to.to_warehouse_id,
        code: '',
        name: 'Unknown',
      },
      lines_count: to.lines_count || 0,
    })
  )

  return {
    data: items,
    meta: {
      total: data.total || data.meta?.total || items.length,
      page: data.meta?.page || params.page || 1,
      limit: data.meta?.limit || params.limit || 20,
      pages: data.meta?.pages || Math.ceil((data.total || items.length) / (params.limit || 20)),
    },
  }
}

// ============================================================================
// TO SUMMARY
// ============================================================================

export interface TOSummary {
  open_count: number
  in_transit_count: number
  overdue_count: number
  this_week_count: number
}

/**
 * Fetch TO summary (KPI counts)
 */
async function fetchTOSummary(): Promise<TOSummary> {
  const response = await fetch('/api/planning/transfer-orders/summary')

  if (!response.ok) {
    // If endpoint doesn't exist yet, calculate from list
    const listResponse = await fetch('/api/planning/transfer-orders?limit=1000')
    if (listResponse.ok) {
      const data = await listResponse.json()
      const tos = data.transfer_orders || data.data || []
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())

      return {
        open_count: tos.filter(
          (to: any) => !['closed', 'cancelled'].includes(to.status)
        ).length,
        in_transit_count: tos.filter(
          (to: any) => ['shipped', 'partially_shipped'].includes(to.status)
        ).length,
        overdue_count: tos.filter((to: any) => {
          const plannedDate = new Date(to.planned_ship_date)
          return (
            plannedDate < today &&
            ['draft', 'planned'].includes(to.status)
          )
        }).length,
        this_week_count: tos.filter((to: any) => {
          const createdDate = new Date(to.created_at)
          return createdDate >= startOfWeek
        }).length,
      }
    }
    throw new Error('Failed to fetch TO summary')
  }

  const data = await response.json()
  return data.data || data
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch paginated transfer orders with filtering
 */
export function useTransferOrders(params: TOListParams = {}) {
  const queryParams: TOListParams = {
    page: params.page || 1,
    limit: params.limit || 20,
    ...params,
  }

  return useQuery({
    queryKey: transferOrderKeys.list(queryParams),
    queryFn: () => fetchTransferOrders(queryParams),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to fetch TO summary for KPI cards
 */
export function useTOSummary() {
  return useQuery({
    queryKey: transferOrderKeys.summary(),
    queryFn: fetchTOSummary,
    staleTime: 60 * 1000, // 1 minute
  })
}

export default useTransferOrders
