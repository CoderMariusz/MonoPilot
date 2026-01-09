/**
 * useRecalculateCost Hook (Story 02.9)
 * React Query mutation for recalculating BOM cost
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RecalculateCostResponse } from '@/lib/types/costing'
import { bomCostKeys } from './use-bom-cost'

/**
 * Recalculate BOM cost API call
 */
async function recalculateCostApi(bomId: string): Promise<RecalculateCostResponse> {
  const response = await fetch(`/api/technical/boms/${bomId}/recalculate-cost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to recalculate cost')
  }

  return response.json()
}

/**
 * Hook to recalculate BOM cost
 * Invalidates the cost query on success
 */
export function useRecalculateCost() {
  const queryClient = useQueryClient()

  return useMutation<RecalculateCostResponse, Error, string>({
    mutationFn: recalculateCostApi,
    onSuccess: (_data, bomId) => {
      // Invalidate cost query to refresh data
      queryClient.invalidateQueries({ queryKey: bomCostKeys.detail(bomId) })
    },
  })
}
