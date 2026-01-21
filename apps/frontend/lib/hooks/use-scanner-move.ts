/**
 * Scanner Move Hooks (Story 05.20)
 * Purpose: React Query hooks for scanner move operations
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  LPLookupResult,
  LocationLookupResult,
  ScannerMoveResult,
  MoveValidationResult,
  RecentMoveResult,
} from '@/lib/validation/scanner-move'

// =============================================================================
// LP Lookup Hook
// =============================================================================

interface LPLookupParams {
  barcode: string
}

export function useLPLookup() {
  return useMutation<LPLookupResult, Error, LPLookupParams>({
    mutationFn: async ({ barcode }) => {
      const response = await fetch(
        `/api/warehouse/scanner/lookup/lp/${encodeURIComponent(barcode)}`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'LP not found')
      }

      const data = await response.json()
      return data.data
    },
  })
}

// =============================================================================
// Location Lookup Hook
// =============================================================================

interface LocationLookupParams {
  barcode: string
}

export function useLocationLookup() {
  return useMutation<LocationLookupResult, Error, LocationLookupParams>({
    mutationFn: async ({ barcode }) => {
      const response = await fetch(
        `/api/warehouse/scanner/lookup/location/${encodeURIComponent(barcode)}`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Location not found')
      }

      const data = await response.json()
      return data.data
    },
  })
}

// =============================================================================
// Validate Move Hook
// =============================================================================

interface ValidateMoveParams {
  lp_id: string
  to_location_id: string
}

export function useValidateMove() {
  return useMutation<MoveValidationResult, Error, ValidateMoveParams>({
    mutationFn: async ({ lp_id, to_location_id }) => {
      const response = await fetch('/api/warehouse/scanner/validate-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lp_id, to_location_id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Validation failed')
      }

      const data = await response.json()
      return data.data
    },
  })
}

// =============================================================================
// Process Move Hook
// =============================================================================

interface ProcessMoveParams {
  lp_id: string
  to_location_id: string
  notes?: string | null
}

export function useProcessMove() {
  const queryClient = useQueryClient()

  return useMutation<ScannerMoveResult, Error, ProcessMoveParams>({
    mutationFn: async ({ lp_id, to_location_id, notes }) => {
      const response = await fetch('/api/warehouse/scanner/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lp_id, to_location_id, notes }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Move failed')
      }

      const data = await response.json()
      return data.data
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['recentMoves'] })
      queryClient.invalidateQueries({ queryKey: ['licensePlates'] })
    },
  })
}

// =============================================================================
// Recent Moves Hook
// =============================================================================

interface RecentMovesParams {
  limit?: number
}

export function useRecentMoves(params: RecentMovesParams = {}) {
  const { limit = 5 } = params

  return useQuery<RecentMoveResult[], Error>({
    queryKey: ['recentMoves', limit],
    queryFn: async () => {
      const response = await fetch(`/api/warehouse/scanner/move/recent?limit=${limit}`)

      if (!response.ok) {
        throw new Error('Failed to load recent moves')
      }

      const data = await response.json()
      return data.data || []
    },
    staleTime: 60 * 1000, // 1 minute
  })
}
