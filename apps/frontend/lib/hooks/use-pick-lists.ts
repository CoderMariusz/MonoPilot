/**
 * Pick List Hooks
 * Story 07.8: Pick List Generation
 *
 * React Query hooks for pick list operations:
 * - usePickLists - List with filtering
 * - usePickList - Single pick list detail
 * - useCreatePickList - Create new pick list
 * - useAssignPicker - Assign picker to pick list
 * - useMyPicks - Get current user's assigned pick lists
 * - usePickListLines - Get pick lines for a pick list
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query'

// =============================================================================
// Types
// =============================================================================

export type PickListStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
export type PickListPriority = 'low' | 'normal' | 'high' | 'urgent'
export type PickListType = 'single_order' | 'wave'
export type PickStrategy = 'zone' | 'route' | 'fifo'

export interface PickList {
  id: string
  org_id: string
  pick_list_number: string
  pick_type: PickListType
  status: PickListStatus
  priority: PickListPriority
  assigned_to: string | null
  assigned_to_name?: string
  wave_id: string | null
  created_at: string
  created_by: string
  started_at: string | null
  completed_at: string | null
  line_count?: number
  total_quantity?: number
  picked_quantity?: number
}

export interface PickListLine {
  id: string
  org_id: string
  pick_list_id: string
  sales_order_line_id: string
  license_plate_id: string | null
  location_id: string
  product_id: string
  lot_number: string | null
  quantity_to_pick: number
  quantity_picked: number
  pick_sequence: number
  status: 'pending' | 'picked' | 'short'
  picked_license_plate_id: string | null
  picked_at: string | null
  picked_by: string | null
  product?: {
    id: string
    code: string
    name: string
  }
  location?: {
    id: string
    full_path: string
    zone?: string
    aisle?: string
    bin?: string
  }
}

export interface PickListWithLines extends PickList {
  lines: PickListLine[]
  sales_orders: Array<{
    id: string
    order_number: string
    customer_name: string
  }>
}

export interface PickListListParams {
  page?: number
  limit?: number
  search?: string
  status?: PickListStatus | PickListStatus[]
  assigned_to?: string
  priority?: PickListPriority
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
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

export interface CreatePickListRequest {
  sales_order_ids: string[]
  priority?: PickListPriority
  assigned_to?: string
  strategy?: PickStrategy
}

export interface CreatePickListResponse {
  pick_list_id: string
  pick_list_number: string
  pick_type: PickListType
  status: PickListStatus
  line_count: number
}

export interface AssignPickerRequest {
  assigned_to: string
}

// =============================================================================
// Query Keys
// =============================================================================

export const pickListKeys = {
  all: ['pick-lists'] as const,
  lists: () => [...pickListKeys.all, 'list'] as const,
  list: (params: PickListListParams) => [...pickListKeys.lists(), params] as const,
  details: () => [...pickListKeys.all, 'detail'] as const,
  detail: (id: string) => [...pickListKeys.details(), id] as const,
  lines: (plId: string) => [...pickListKeys.all, 'lines', plId] as const,
  myPicks: () => [...pickListKeys.all, 'my-picks'] as const,
}

// =============================================================================
// API Functions
// =============================================================================

function buildQueryString(params: PickListListParams): string {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())
  if (params.search) searchParams.append('search', params.search)
  if (params.assigned_to) searchParams.append('assigned_to', params.assigned_to)
  if (params.priority) searchParams.append('priority', params.priority)

  if (params.status) {
    const statusStr = Array.isArray(params.status) ? params.status.join(',') : params.status
    searchParams.append('status', statusStr)
  }

  if (params.date_from) searchParams.append('date_from', params.date_from)
  if (params.date_to) searchParams.append('date_to', params.date_to)
  if (params.sort_by) searchParams.append('sort_by', params.sort_by)
  if (params.sort_order) searchParams.append('sort_order', params.sort_order)

  return searchParams.toString()
}

async function fetchPickLists(params: PickListListParams): Promise<PaginatedResult<PickList>> {
  const queryString = buildQueryString(params)
  const url = `/api/shipping/pick-lists${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch pick lists')
  }

  const data = await response.json()

  return {
    data: data.pick_lists || data.data || [],
    pagination: {
      page: data.page || params.page || 1,
      limit: data.limit || params.limit || 20,
      total: data.total || 0,
      totalPages: data.pages || Math.ceil((data.total || 0) / (params.limit || 20)),
    },
  }
}

async function fetchPickList(id: string): Promise<PickListWithLines> {
  const response = await fetch(`/api/shipping/pick-lists/${id}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch pick list')
  }

  const data = await response.json()
  return data.pick_list || data
}

async function fetchPickListLines(id: string): Promise<PickListLine[]> {
  const response = await fetch(`/api/shipping/pick-lists/${id}/lines`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch pick list lines')
  }

  const data = await response.json()
  return data.lines || data
}

async function fetchMyPicks(): Promise<PickList[]> {
  const response = await fetch('/api/shipping/pick-lists/my-picks')
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch my picks')
  }

  const data = await response.json()
  return data.pick_lists || data
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch paginated pick lists
 */
export function usePickLists(params: PickListListParams = {}): UseQueryResult<PaginatedResult<PickList>> {
  const queryParams: PickListListParams = {
    page: params.page || 1,
    limit: params.limit || 20,
    ...params,
  }

  return useQuery({
    queryKey: pickListKeys.list(queryParams),
    queryFn: () => fetchPickLists(queryParams),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (prev) => prev,
  })
}

/**
 * Fetch single pick list with lines
 */
export function usePickList(id: string | null): UseQueryResult<PickListWithLines> {
  return useQuery({
    queryKey: pickListKeys.detail(id || ''),
    queryFn: () => fetchPickList(id!),
    enabled: !!id,
  })
}

/**
 * Fetch pick list lines
 */
export function usePickListLines(id: string | null): UseQueryResult<PickListLine[]> {
  return useQuery({
    queryKey: pickListKeys.lines(id || ''),
    queryFn: () => fetchPickListLines(id!),
    enabled: !!id,
  })
}

/**
 * Fetch current user's assigned pick lists
 */
export function useMyPicks(): UseQueryResult<PickList[]> {
  return useQuery({
    queryKey: pickListKeys.myPicks(),
    queryFn: fetchMyPicks,
    staleTime: 30 * 1000,
  })
}

/**
 * Create new pick list
 */
export function useCreatePickList(): UseMutationResult<CreatePickListResponse, Error, CreatePickListRequest> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePickListRequest) => {
      const response = await fetch('/api/shipping/pick-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || error.message || 'Failed to create pick list')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pickListKeys.lists() })
    },
  })
}

/**
 * Assign picker to pick list
 */
export function useAssignPicker(): UseMutationResult<PickList, Error, { id: string; data: AssignPickerRequest }> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/shipping/pick-lists/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to assign picker')
      }

      const result = await response.json()
      return result.pick_list || result
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pickListKeys.lists() })
      queryClient.invalidateQueries({ queryKey: pickListKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: pickListKeys.myPicks() })
    },
  })
}

/**
 * Cancel pick list
 */
export function useCancelPickList(): UseMutationResult<PickList, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/shipping/pick-lists/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || 'Failed to cancel pick list')
      }

      const result = await response.json()
      return result.pick_list || result
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: pickListKeys.lists() })
      queryClient.invalidateQueries({ queryKey: pickListKeys.detail(id) })
    },
  })
}

export default usePickLists
