/**
 * React Hooks: LP Split Operations (Story 05.17)
 *
 * Provides hooks for LP split workflow:
 * - useSplitLP: Mutation hook for executing split
 * - useValidateSplit: Query hook for validating split params
 *
 * Per WH-FR-006
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { licensePlateKeys } from './use-license-plates'
import { validateSplitWithContext, type SplitContextValidationResult } from '@/lib/validation/lp-split-schema'

// =============================================================================
// Types
// =============================================================================

export interface SplitLPInput {
  lpId: string
  splitQty: number
  destinationLocationId?: string | null
}

export interface SplitLPResult {
  success: boolean
  source_lp: {
    id: string
    lp_number: string
    new_quantity: number
    uom: string
    location_id: string
    location_code: string
    status: string
  }
  new_lp: {
    id: string
    lp_number: string
    quantity: number
    uom: string
    location_id: string
    location_code: string
    status: string
    qa_status: string
    batch_number: string | null
    expiry_date: string | null
    product_id: string
    created_at: string
  }
  genealogy: {
    id: string
    operation_type: string
    parent_lp_id: string
    parent_lp_number: string
    child_lp_id: string
    child_lp_number: string
    quantity: number
    operation_date: string
    operation_id: string
  }
  operation_time_ms?: number
}

export interface SplitValidationInput {
  splitQty: number
  sourceLpQty: number
  sourceStatus: string
}

// =============================================================================
// Client-Side Validation Hook
// =============================================================================

/**
 * Validates split parameters on the client side
 * Does not require an API call - performs validation locally
 *
 * @param input - Split validation parameters
 * @returns Validation result with error messages if invalid
 */
export function useValidateSplit(input: SplitValidationInput | null): SplitContextValidationResult {
  if (!input) {
    return { valid: false, error: 'No validation input provided' }
  }

  const { splitQty, sourceLpQty, sourceStatus } = input

  // Check LP status
  if (sourceStatus !== 'available') {
    return {
      valid: false,
      error: `Cannot split LP. Status must be 'available'. Current status: ${sourceStatus}`,
    }
  }

  // Check split quantity
  return validateSplitWithContext(splitQty, sourceLpQty)
}

// =============================================================================
// Split LP Mutation Hook
// =============================================================================

/**
 * Mutation hook for executing LP split operation
 *
 * Features:
 * - Calls POST /api/warehouse/license-plates/:id/split
 * - Invalidates relevant queries on success
 * - Returns full split result including new LP and genealogy
 *
 * @returns React Query mutation object
 */
export function useSplitLP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SplitLPInput): Promise<SplitLPResult> => {
      const { lpId, splitQty, destinationLocationId } = input

      const response = await fetch(`/api/warehouse/license-plates/${lpId}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          splitQty,
          destinationLocationId: destinationLocationId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to split license plate')
      }

      const data = await response.json()
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate LP list and summary
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.summary() })

      // Invalidate source LP detail
      queryClient.invalidateQueries({ queryKey: licensePlateKeys.detail(variables.lpId) })
    },
  })
}
