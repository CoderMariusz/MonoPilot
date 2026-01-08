/**
 * React Query Hooks for WO Material Reservations
 * Story 03.11b: WO Material Reservations (LP Allocation)
 *
 * Hooks for fetching and managing LP reservations for WO materials
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ReservationResponse,
  ReservationsListResponse,
  AvailableLP,
  AvailableLPsResponse,
  ReleaseReservationResponse,
} from '@/lib/validation/wo-reservations'

// ============================================================================
// TYPES
// ============================================================================

export interface WOReservation extends ReservationResponse {
  lot_number?: string | null
}

export interface ReserveLPInput {
  lp_id: string
  quantity: number
}

export interface ReserveLPsRequest {
  reservations: ReserveLPInput[]
  acknowledge_over_reservation?: boolean
}

export interface ReserveLPsResponse {
  reservations: WOReservation[]
  total_reserved: number
  required_qty: number
  coverage_percent: number
  is_complete: boolean
}

export interface AvailableLPsFilters {
  sort?: 'fifo' | 'fefo'
  lot_number?: string
  location?: string
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const woReservationKeys = {
  all: ['wo-reservations'] as const,
  lists: () => [...woReservationKeys.all, 'list'] as const,
  list: (woId: string, materialId: string) =>
    [...woReservationKeys.lists(), woId, materialId] as const,
  availableLPs: (woId: string, materialId: string, filters?: AvailableLPsFilters) =>
    [...woReservationKeys.all, 'available', woId, materialId, filters] as const,
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch reservations for a WO material
 */
async function fetchReservations(
  woId: string,
  materialId: string
): Promise<ReservationsListResponse> {
  const response = await fetch(
    `/api/planning/work-orders/${woId}/materials/${materialId}/reservations`
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch reservations')
  }

  const data = await response.json()
  return data.data || data
}

/**
 * Fetch available LPs for a WO material
 */
async function fetchAvailableLPs(
  woId: string,
  materialId: string,
  filters?: AvailableLPsFilters
): Promise<AvailableLPsResponse> {
  const params = new URLSearchParams()
  if (filters?.sort) params.set('sort', filters.sort)
  if (filters?.lot_number) params.set('lot_number', filters.lot_number)
  if (filters?.location) params.set('location', filters.location)

  const response = await fetch(
    `/api/planning/work-orders/${woId}/materials/${materialId}/available-lps?${params}`
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch available LPs')
  }

  const data = await response.json()
  return data.data || data
}

/**
 * Reserve LPs for a WO material
 */
async function reserveLPs(
  woId: string,
  materialId: string,
  request: ReserveLPsRequest
): Promise<ReserveLPsResponse> {
  const response = await fetch(
    `/api/planning/work-orders/${woId}/materials/${materialId}/reservations`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to reserve LPs')
  }

  const data = await response.json()
  return data.data || data
}

/**
 * Release a reservation
 */
async function releaseReservation(
  woId: string,
  reservationId: string
): Promise<ReleaseReservationResponse> {
  const response = await fetch(
    `/api/planning/work-orders/${woId}/reservations/${reservationId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to release reservation')
  }

  const data = await response.json()
  return data.data || data
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch reservations for a WO material
 */
export function useWOReservations(
  woId: string | undefined,
  materialId: string | undefined
) {
  return useQuery({
    queryKey: woReservationKeys.list(woId || '', materialId || ''),
    queryFn: () => fetchReservations(woId!, materialId!),
    enabled: !!woId && !!materialId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch available LPs for a WO material
 */
export function useAvailableLPsForMaterial(
  woId: string | undefined,
  materialId: string | undefined,
  filters?: AvailableLPsFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: woReservationKeys.availableLPs(woId || '', materialId || '', filters),
    queryFn: () => fetchAvailableLPs(woId!, materialId!, filters),
    enabled: (options?.enabled ?? true) && !!woId && !!materialId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to reserve LPs for a WO material
 */
export function useReserveLPs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      woId,
      materialId,
      reservations,
      acknowledgeOverReservation,
    }: {
      woId: string
      materialId: string
      reservations: ReserveLPInput[]
      acknowledgeOverReservation?: boolean
    }) =>
      reserveLPs(woId, materialId, {
        reservations,
        acknowledge_over_reservation: acknowledgeOverReservation,
      }),
    onSuccess: (_, variables) => {
      // Invalidate reservations for this material
      queryClient.invalidateQueries({
        queryKey: woReservationKeys.list(variables.woId, variables.materialId),
      })
      // Invalidate available LPs (some are now reserved)
      queryClient.invalidateQueries({
        queryKey: woReservationKeys.availableLPs(variables.woId, variables.materialId),
      })
      // Invalidate WO materials list to refresh coverage status
      queryClient.invalidateQueries({
        queryKey: ['wo-materials', variables.woId],
      })
    },
  })
}

/**
 * Hook to release a reservation
 */
export function useReleaseReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      woId,
      materialId,
      reservationId,
    }: {
      woId: string
      materialId: string
      reservationId: string
    }) => releaseReservation(woId, reservationId),
    onSuccess: (_, variables) => {
      // Invalidate reservations for this material
      queryClient.invalidateQueries({
        queryKey: woReservationKeys.list(variables.woId, variables.materialId),
      })
      // Invalidate available LPs (released LP is now available)
      queryClient.invalidateQueries({
        queryKey: woReservationKeys.availableLPs(variables.woId, variables.materialId),
      })
      // Invalidate WO materials list to refresh coverage status
      queryClient.invalidateQueries({
        queryKey: ['wo-materials', variables.woId],
      })
    },
  })
}

export default {
  useWOReservations,
  useAvailableLPsForMaterial,
  useReserveLPs,
  useReleaseReservation,
}
