/**
 * React Hooks: LP Reservations
 * Story: 05.3 - LP Reservations + FIFO/FEFO Picking
 *
 * React Query hooks for LP reservation operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================================================
// TYPES
// ============================================================================

export interface LPReservation {
  id: string
  lp_id: string
  wo_id: string | null
  to_id: string | null
  wo_material_id: string | null
  reserved_qty: number
  consumed_qty: number
  status: 'active' | 'released' | 'consumed'
  reserved_at: string
  released_at: string | null
  reserved_by: string
  created_at: string
}

export interface LPReservationWithLP extends LPReservation {
  lp: {
    lp_number: string
    product_id: string
    product_name: string
    batch_number: string | null
    expiry_date: string | null
    location_id: string
    location_path: string
    warehouse_id: string
    warehouse_name: string
  }
  remaining_qty: number
}

export interface AvailableLP {
  id: string
  lp_number: string
  product_id: string
  product_name: string
  batch_number: string | null
  expiry_date: string | null
  quantity: number
  available_qty: number
  reserved_qty: number
  uom: string
  location_id: string
  location_path: string
  warehouse_id: string
  warehouse_name: string
  created_at: string
  suggestion_rank?: number
  suggestion_reason?: 'FIFO Oldest' | 'FEFO Next' | 'FIFO Next'
}

export interface LPSelection {
  lpId: string
  lpNumber: string
  reservedQty: number
  batch: string | null
  expiryDate: string | null
  location: string
}

export interface ReserveLPsInput {
  woId: string
  materialId?: string
  productId: string
  requiredQty: number
  selections: LPSelection[]
}

export interface ReserveLPsResult {
  success: boolean
  reservations: LPReservation[]
  total_reserved: number
  shortfall: number
  warning?: string
}

export interface AvailableLPsParams {
  productId: string
  warehouseId?: string
  strategy?: 'fifo' | 'fefo' | 'none'
  locationId?: string
  batch?: string
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const lpReservationKeys = {
  all: ['lp-reservations'] as const,
  lists: () => [...lpReservationKeys.all, 'list'] as const,
  list: (woId: string) => [...lpReservationKeys.lists(), woId] as const,
  details: () => [...lpReservationKeys.all, 'detail'] as const,
  detail: (id: string) => [...lpReservationKeys.details(), id] as const,
  available: (params: AvailableLPsParams) => [...lpReservationKeys.all, 'available', params] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetches reservations for a Work Order
 */
export function useWOReservations(woId: string | null) {
  return useQuery({
    queryKey: lpReservationKeys.list(woId || ''),
    queryFn: async (): Promise<LPReservationWithLP[]> => {
      if (!woId) return []

      const response = await fetch(`/api/warehouse/reservations/wo/${woId}`)

      if (!response.ok) {
        if (response.status === 404) return []
        throw new Error('Failed to fetch reservations')
      }

      const data = await response.json()
      return data.data || data.reservations || []
    },
    enabled: !!woId,
    staleTime: 30000,
  })
}

/**
 * Fetches available LPs for reservation with FIFO/FEFO suggestions
 */
export function useAvailableLPs(params: AvailableLPsParams) {
  return useQuery({
    queryKey: lpReservationKeys.available(params),
    queryFn: async (): Promise<AvailableLP[]> => {
      const queryParams = new URLSearchParams()
      queryParams.append('product_id', params.productId)
      if (params.warehouseId) queryParams.append('warehouse_id', params.warehouseId)
      if (params.strategy) queryParams.append('strategy', params.strategy)
      if (params.locationId) queryParams.append('location_id', params.locationId)
      if (params.batch) queryParams.append('batch', params.batch)

      const response = await fetch(`/api/warehouse/reservations/available?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch available LPs')
      }

      const data = await response.json()
      return data.data || data.available_lps || []
    },
    enabled: !!params.productId,
    staleTime: 10000, // Short stale time for real-time availability
  })
}

/**
 * Fetches a single reservation
 */
export function useLPReservation(id: string | null) {
  return useQuery({
    queryKey: lpReservationKeys.detail(id || ''),
    queryFn: async (): Promise<LPReservation | null> => {
      if (!id) return null

      const response = await fetch(`/api/warehouse/reservations/${id}`)

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch reservation')
      }

      const data = await response.json()
      return data.data || data.reservation || data
    },
    enabled: !!id,
    staleTime: 30000,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Creates LP reservations for a Work Order
 */
export function useReserveLPs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ReserveLPsInput): Promise<ReserveLPsResult> => {
      const response = await fetch('/api/warehouse/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create reservations')
      }

      const data = await response.json()
      return data.data || data
    },
    onSuccess: (_, variables) => {
      // Invalidate WO reservations
      queryClient.invalidateQueries({ queryKey: lpReservationKeys.list(variables.woId) })
      // Invalidate available LPs
      queryClient.invalidateQueries({ queryKey: [...lpReservationKeys.all, 'available'] })
    },
  })
}

/**
 * Releases a reservation
 */
export function useReleaseReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, woId }: { id: string; woId: string }): Promise<LPReservation> => {
      const response = await fetch(`/api/warehouse/reservations/${id}/release`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to release reservation')
      }

      const data = await response.json()
      return data.data || data.reservation || data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: lpReservationKeys.list(variables.woId) })
      queryClient.invalidateQueries({ queryKey: lpReservationKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: [...lpReservationKeys.all, 'available'] })
    },
  })
}

/**
 * Releases all reservations for a Work Order
 */
export function useReleaseAllReservations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (woId: string): Promise<{ count: number }> => {
      const response = await fetch(`/api/warehouse/reservations/wo/${woId}/release-all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to release reservations')
      }

      const data = await response.json()
      return data.data || data
    },
    onSuccess: (_, woId) => {
      queryClient.invalidateQueries({ queryKey: lpReservationKeys.list(woId) })
      queryClient.invalidateQueries({ queryKey: [...lpReservationKeys.all, 'available'] })
    },
  })
}

/**
 * Updates a reservation (e.g., consumed quantity)
 */
export function useUpdateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      woId,
      consumedQty,
    }: {
      id: string
      woId: string
      consumedQty?: number
    }): Promise<LPReservation> => {
      const response = await fetch(`/api/warehouse/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumed_qty: consumedQty }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update reservation')
      }

      const data = await response.json()
      return data.data || data.reservation || data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: lpReservationKeys.list(variables.woId) })
      queryClient.invalidateQueries({ queryKey: lpReservationKeys.detail(variables.id) })
    },
  })
}
