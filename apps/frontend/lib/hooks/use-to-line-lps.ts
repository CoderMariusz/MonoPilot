/**
 * React Query Hooks for TO Line LP Operations
 * Story 03.9b: TO License Plate Pre-selection
 *
 * Hooks for fetching and managing LP assignments for TO lines
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================================================
// TYPES
// ============================================================================

export interface LPAssignment {
  id: string
  lp_id: string
  lp_number: string
  quantity: number
  lot_number: string | null
  expiry_date: string | null
  location: string | null
}

export interface LPAssignmentsResponse {
  assignments: LPAssignment[]
  total_assigned: number
  total_required: number
  is_complete: boolean
}

export interface AvailableLP {
  id: string
  lp_number: string
  lot_number: string | null
  expiry_date: string | null
  location: string | null
  available_qty: number
  uom: string
}

export interface AvailableLPsResponse {
  lps: AvailableLP[]
  total_count: number
  filters_applied: {
    warehouse_id: string
    product_id: string
    lot_number?: string
    expiry_from?: string
    expiry_to?: string
  }
}

export interface AssignLPsRequest {
  lps: Array<{
    lp_id: string
    quantity: number
  }>
}

export interface LPPickerFilters {
  lot_number?: string
  expiry_from?: string
  expiry_to?: string
  search?: string
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const toLineLPKeys = {
  all: ['to-line-lps'] as const,
  lists: () => [...toLineLPKeys.all, 'list'] as const,
  list: (toId: string, lineId: string) =>
    [...toLineLPKeys.lists(), toId, lineId] as const,
  available: (toId: string, lineId: string, filters?: LPPickerFilters) =>
    [...toLineLPKeys.all, 'available', toId, lineId, filters] as const,
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch LP assignments for a TO line
 */
async function fetchLineLPs(
  toId: string,
  lineId: string
): Promise<LPAssignmentsResponse> {
  const response = await fetch(
    `/api/planning/transfer-orders/${toId}/lines/${lineId}/lps`
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch LP assignments')
  }

  const data = await response.json()
  return data.data || data
}

/**
 * Fetch available LPs for a TO line
 */
async function fetchAvailableLPs(
  toId: string,
  lineId: string,
  filters?: LPPickerFilters
): Promise<AvailableLPsResponse> {
  const params = new URLSearchParams()
  if (filters?.lot_number) params.set('lot_number', filters.lot_number)
  if (filters?.expiry_from) params.set('expiry_from', filters.expiry_from)
  if (filters?.expiry_to) params.set('expiry_to', filters.expiry_to)
  if (filters?.search) params.set('search', filters.search)

  const response = await fetch(
    `/api/planning/transfer-orders/${toId}/lines/${lineId}/available-lps?${params}`
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch available LPs')
  }

  const data = await response.json()
  return data.data || data
}

/**
 * Assign LPs to a TO line
 */
async function assignLPs(
  toId: string,
  lineId: string,
  request: AssignLPsRequest
): Promise<LPAssignmentsResponse> {
  const response = await fetch(
    `/api/planning/transfer-orders/${toId}/lines/${lineId}/assign-lps`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to assign LPs')
  }

  const data = await response.json()
  return data.data || data
}

/**
 * Remove LP assignment from a TO line
 */
async function removeLP(
  toId: string,
  lineId: string,
  lpId: string
): Promise<void> {
  const response = await fetch(
    `/api/planning/transfer-orders/${toId}/lines/${lineId}/lps/${lpId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to remove LP assignment')
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch LP assignments for a TO line
 */
export function useTOLineLPs(toId: string | undefined, lineId: string | undefined) {
  return useQuery({
    queryKey: toLineLPKeys.list(toId || '', lineId || ''),
    queryFn: () => fetchLineLPs(toId!, lineId!),
    enabled: !!toId && !!lineId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch available LPs for a TO line
 */
export function useAvailableLPs(
  toId: string | undefined,
  lineId: string | undefined,
  filters?: LPPickerFilters
) {
  return useQuery({
    queryKey: toLineLPKeys.available(toId || '', lineId || '', filters),
    queryFn: () => fetchAvailableLPs(toId!, lineId!, filters),
    enabled: !!toId && !!lineId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to assign LPs to a TO line
 */
export function useAssignLPs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      toId,
      lineId,
      lps,
    }: {
      toId: string
      lineId: string
      lps: Array<{ lp_id: string; quantity: number }>
    }) => assignLPs(toId, lineId, { lps }),
    onSuccess: (_, variables) => {
      // Invalidate LP assignments for this line
      queryClient.invalidateQueries({
        queryKey: toLineLPKeys.list(variables.toId, variables.lineId),
      })
      // Invalidate available LPs (some are now assigned)
      queryClient.invalidateQueries({
        queryKey: toLineLPKeys.available(variables.toId, variables.lineId),
      })
      // Invalidate transfer order detail to refresh line LP counts
      queryClient.invalidateQueries({
        queryKey: ['transfer-orders', 'detail', variables.toId],
      })
    },
  })
}

/**
 * Hook to remove LP assignment from a TO line
 */
export function useRemoveLP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      toId,
      lineId,
      lpId,
    }: {
      toId: string
      lineId: string
      lpId: string
    }) => removeLP(toId, lineId, lpId),
    onSuccess: (_, variables) => {
      // Invalidate LP assignments for this line
      queryClient.invalidateQueries({
        queryKey: toLineLPKeys.list(variables.toId, variables.lineId),
      })
      // Invalidate available LPs (removed LP is now available again)
      queryClient.invalidateQueries({
        queryKey: toLineLPKeys.available(variables.toId, variables.lineId),
      })
      // Invalidate transfer order detail to refresh line LP counts
      queryClient.invalidateQueries({
        queryKey: ['transfer-orders', 'detail', variables.toId],
      })
    },
  })
}

export default {
  useTOLineLPs,
  useAvailableLPs,
  useAssignLPs,
  useRemoveLP,
}
