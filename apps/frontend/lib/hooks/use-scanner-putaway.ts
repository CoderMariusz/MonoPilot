/**
 * useScannerPutaway Hook (Story 05.21)
 * Purpose: React Query hooks for scanner putaway operations
 *
 * Hooks provided:
 * - useLPLookup - Lookup LP by barcode
 * - useLocationLookup - Lookup location by barcode
 * - useSuggestLocation - Get putaway location suggestion
 * - useProcessPutaway - Execute putaway transaction
 * - useValidatePutaway - Pre-validate putaway
 */

import { useMutation, useQuery } from '@tanstack/react-query'

// Types
export interface LPData {
  id: string
  lp_number: string
  product_name: string
  product_code: string
  quantity: number
  uom: string
  batch_number?: string
  expiry_date?: string
  current_location: string
  status: string
}

export interface LocationData {
  id: string
  location_code: string
  name: string
  full_path: string
  zone_id?: string
  zone_name?: string
  aisle?: string
  rack?: string
  level?: string
  is_active: boolean
}

export interface SuggestedLocationData {
  id: string
  location_code: string
  full_path: string
  zone_id?: string
  zone_name?: string
  aisle?: string
  rack?: string
  level?: string
}

export interface LocationSuggestion {
  suggestedLocation: SuggestedLocationData | null
  reason: string
  reasonCode: string
  alternatives: Array<{ id: string; location_code: string; reason: string }>
  strategyUsed: 'fifo' | 'fefo' | 'none'
  lpDetails: {
    lp_number: string
    product_name: string
    quantity: number
    uom: string
    expiry_date?: string
    current_location: string
  }
}

export interface PutawayRequest {
  lpId: string
  locationId: string
  suggestedLocationId?: string
  override: boolean
  overrideReason?: string
}

export interface PutawayResult {
  stockMove: {
    id: string
    move_number: string
    move_type: string
    from_location_id: string
    to_location_id: string
    quantity: number
    status: string
  }
  lp: {
    id: string
    lp_number: string
    location_id: string
    location_path: string
  }
  overrideApplied: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
  warnings: Array<{ field: string; message: string }>
}

// LP Lookup Hook
export function useLPLookup() {
  return useMutation({
    mutationFn: async (barcode: string): Promise<LPData> => {
      const response = await fetch(`/api/warehouse/scanner/lookup/lp/${encodeURIComponent(barcode)}`)
      const data = await response.json()

      if (!response.ok || !data.data) {
        throw new Error(data.error || 'LP not found')
      }

      return {
        id: data.data.id,
        lp_number: data.data.lp_number,
        product_name: data.data.product?.name || data.data.product_name,
        product_code: data.data.product?.code || data.data.product_code,
        quantity: data.data.quantity || data.data.current_qty,
        uom: data.data.uom,
        batch_number: data.data.batch_number,
        expiry_date: data.data.expiry_date,
        current_location: data.data.location?.full_path || data.data.current_location,
        status: data.data.status,
      }
    },
  })
}

// Location Lookup Hook
export function useLocationLookup() {
  return useMutation({
    mutationFn: async (barcode: string): Promise<LocationData> => {
      const response = await fetch(`/api/warehouse/scanner/lookup/location/${encodeURIComponent(barcode)}`)
      const data = await response.json()

      if (!response.ok || !data.data) {
        throw new Error(data.error || 'Location not found')
      }

      return data.data
    },
  })
}

// Suggest Location Hook
export function useSuggestLocation() {
  return useMutation({
    mutationFn: async (lpId: string): Promise<LocationSuggestion> => {
      const response = await fetch(`/api/warehouse/scanner/putaway/suggest/${lpId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get putaway suggestion')
      }

      return {
        suggestedLocation: data.suggested_location,
        reason: data.reason,
        reasonCode: data.reason_code,
        alternatives: data.alternatives || [],
        strategyUsed: data.strategy_used || 'fifo',
        lpDetails: data.lp_details,
      }
    },
  })
}

// Process Putaway Hook
export function useProcessPutaway() {
  return useMutation({
    mutationFn: async (request: PutawayRequest): Promise<PutawayResult> => {
      const response = await fetch('/api/warehouse/scanner/putaway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_id: request.lpId,
          location_id: request.locationId,
          suggested_location_id: request.suggestedLocationId,
          override: request.override,
          override_reason: request.overrideReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process putaway')
      }

      return {
        stockMove: data.stock_move,
        lp: data.lp,
        overrideApplied: data.override_applied || request.override,
      }
    },
  })
}

// Validate Putaway Hook
export function useValidatePutaway() {
  return useMutation({
    mutationFn: async (request: { lpId: string; locationId: string; suggestedLocationId?: string }): Promise<ValidationResult> => {
      const response = await fetch('/api/warehouse/scanner/putaway/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_id: request.lpId,
          location_id: request.locationId,
          suggested_location_id: request.suggestedLocationId,
        }),
      })

      const data = await response.json()

      if (!response.ok && response.status !== 400) {
        throw new Error(data.error || 'Validation failed')
      }

      return {
        valid: data.valid ?? false,
        errors: data.errors || [],
        warnings: data.warnings || [],
      }
    },
  })
}

// Suggested Locations Query Hook (for alternatives)
export function useSuggestedLocations(lpId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['putaway-suggestion', lpId],
    queryFn: async (): Promise<LocationSuggestion> => {
      const response = await fetch(`/api/warehouse/scanner/putaway/suggest/${lpId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get putaway suggestion')
      }

      return {
        suggestedLocation: data.suggested_location,
        reason: data.reason,
        reasonCode: data.reason_code,
        alternatives: data.alternatives || [],
        strategyUsed: data.strategy_used || 'fifo',
        lpDetails: data.lp_details,
      }
    },
    enabled: options?.enabled ?? !!lpId,
    staleTime: 30000, // 30 seconds
  })
}

export default {
  useLPLookup,
  useLocationLookup,
  useSuggestLocation,
  useProcessPutaway,
  useValidatePutaway,
  useSuggestedLocations,
}
