/**
 * React Query Hooks: BOM Selection
 * Story 03.10: Work Order CRUD - BOM Auto-Selection
 *
 * Provides hooks for:
 * - useBomForDate: Auto-select BOM based on product and scheduled date
 * - useAvailableBoms: Get all active BOMs for manual selection
 */

import { useQuery } from '@tanstack/react-query'
import type { BomPreview } from '@/lib/types/work-order'
import { workOrderKeys } from './use-work-orders'

/**
 * Fetch auto-selected BOM for product on date
 */
async function fetchBomForDate(
  productId: string,
  scheduledDate: string
): Promise<BomPreview | null> {
  const params = new URLSearchParams({
    product_id: productId,
    scheduled_date: scheduledDate,
  })

  const response = await fetch(`/api/planning/work-orders/bom-for-date?${params}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch BOM')
  }

  const data = await response.json()
  return data.data || null
}

/**
 * Fetch all active BOMs for product (manual selection)
 */
async function fetchAvailableBoms(productId: string): Promise<BomPreview[]> {
  const params = new URLSearchParams({ product_id: productId })

  const response = await fetch(`/api/planning/work-orders/available-boms?${params}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch available BOMs')
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Hook to auto-select BOM based on product and scheduled date
 *
 * @param productId - Product UUID
 * @param scheduledDate - Scheduled date (YYYY-MM-DD format)
 * @returns Query result with auto-selected BOM or null
 */
export function useBomForDate(
  productId: string | null | undefined,
  scheduledDate: string | null | undefined
) {
  return useQuery({
    queryKey: workOrderKeys.bomForDate(productId || '', scheduledDate || ''),
    queryFn: () => fetchBomForDate(productId!, scheduledDate!),
    enabled: !!productId && !!scheduledDate && scheduledDate.length === 10,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to get all active BOMs for manual selection
 *
 * @param productId - Product UUID
 * @returns Query result with array of available BOMs
 */
export function useAvailableBoms(productId: string | null | undefined) {
  return useQuery({
    queryKey: workOrderKeys.availableBoms(productId || ''),
    queryFn: () => fetchAvailableBoms(productId!),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
