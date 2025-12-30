/**
 * useBOMScale Hook (Story 02.14)
 * React Query mutation hook for BOM scaling
 * FR-2.35: BOM Scaling
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ScaleBomResponse, ScaleBomRequest, ScaleParams } from '@/lib/types/bom-advanced'
import { bomKeys } from '@/lib/hooks/use-boms'

// Query keys for cache management
export const bomScaleKeys = {
  all: ['bom-scale'] as const,
  preview: (bomId: string) => [...bomScaleKeys.all, 'preview', bomId] as const,
}

/**
 * Scale BOM via API
 */
async function scaleBOM(
  bomId: string,
  request: ScaleBomRequest
): Promise<ScaleBomResponse> {
  const response = await fetch(`/api/technical/boms/${bomId}/scale`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    if (response.status === 400) {
      throw new Error(error.message || 'Invalid scaling parameters')
    }
    if (response.status === 403) {
      throw new Error('You do not have permission to scale this BOM')
    }
    if (response.status === 404) {
      throw new Error('BOM not found')
    }

    throw new Error(error.message || error.error || 'Failed to scale BOM')
  }

  const data = await response.json()
  return data.result || data
}

/**
 * Preview BOM scaling (read-only)
 */
export async function previewBOMScale(
  bomId: string,
  targetBatchSize?: number,
  scaleFactor?: number,
  roundDecimals: number = 3
): Promise<ScaleBomResponse> {
  return scaleBOM(bomId, {
    target_batch_size: targetBatchSize,
    scale_factor: scaleFactor,
    preview_only: true,
    round_decimals: roundDecimals,
  })
}

/**
 * Hook for BOM scaling mutation
 * @returns React Query mutation for scaling BOM
 */
export function useBOMScale() {
  const queryClient = useQueryClient()

  return useMutation<ScaleBomResponse, Error, ScaleParams>({
    mutationFn: ({ bomId, request }) => scaleBOM(bomId, request),
    onSuccess: (data, { bomId, request }) => {
      // Only invalidate queries if scaling was actually applied
      if (data.applied && !request.preview_only) {
        // Invalidate BOM detail to refresh quantities
        queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) })
        // Invalidate BOM items
        queryClient.invalidateQueries({ queryKey: ['bom-items', bomId] })
        // Invalidate BOM cost since quantities changed
        queryClient.invalidateQueries({ queryKey: ['bom-cost', bomId] })
      }
    },
  })
}

/**
 * Calculate scale factor from batch sizes
 */
export function calculateScaleFactor(
  originalBatchSize: number,
  targetBatchSize: number
): number {
  if (originalBatchSize <= 0) return 1
  return targetBatchSize / originalBatchSize
}

/**
 * Calculate new batch size from scale factor
 */
export function calculateNewBatchSize(
  originalBatchSize: number,
  scaleFactor: number
): number {
  return originalBatchSize * scaleFactor
}

/**
 * Round to specified decimal places
 */
export function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Check if value was rounded (differs from original)
 */
export function wasRounded(original: number, rounded: number, decimals: number): boolean {
  const threshold = Math.pow(10, -(decimals + 1))
  return Math.abs(original - rounded) > threshold
}
