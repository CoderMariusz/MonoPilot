/**
 * React Query Hooks for Shelf Life Management (Story 02.11)
 *
 * Provides hooks for:
 * - useShelfLifeConfig: Get shelf life config for a product
 * - useUpdateShelfLifeConfig: Update configuration
 * - useCalculateShelfLife: Recalculate from ingredients
 * - useRecalculationQueue: Get products needing recalculation
 * - useBulkRecalculate: Recalculate multiple products
 * - useShelfLifeAuditLog: Get audit log for a product
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ShelfLifeConfigResponse,
  CalculateShelfLifeResponse,
  UpdateShelfLifeRequest,
  RecalculationQueueResponse,
  BulkRecalculationResult,
  ShelfLifeAuditLogResponse,
} from '@/lib/types/shelf-life'

// ============================================================================
// Query Keys
// ============================================================================

export const shelfLifeKeys = {
  all: ['shelf-life'] as const,
  configs: () => [...shelfLifeKeys.all, 'config'] as const,
  config: (productId: string) => [...shelfLifeKeys.configs(), productId] as const,
  calculations: () => [...shelfLifeKeys.all, 'calculation'] as const,
  calculation: (productId: string) => [...shelfLifeKeys.calculations(), productId] as const,
  recalculationQueue: () => [...shelfLifeKeys.all, 'recalculation-queue'] as const,
  auditLogs: () => [...shelfLifeKeys.all, 'audit'] as const,
  auditLog: (productId: string) => [...shelfLifeKeys.auditLogs(), productId] as const,
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch shelf life configuration for a product
 */
async function fetchShelfLifeConfig(productId: string): Promise<ShelfLifeConfigResponse | null> {
  const response = await fetch(`/api/technical/shelf-life/products/${productId}`)

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch shelf life configuration')
  }

  return response.json()
}

/**
 * Update shelf life configuration
 */
async function updateShelfLifeConfig(
  productId: string,
  data: UpdateShelfLifeRequest
): Promise<ShelfLifeConfigResponse> {
  const response = await fetch(`/api/technical/shelf-life/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to update shelf life configuration')
  }

  return response.json()
}

/**
 * Calculate shelf life from BOM ingredients
 */
async function calculateShelfLife(
  productId: string,
  forceRecalculate = false
): Promise<CalculateShelfLifeResponse> {
  const response = await fetch(`/api/technical/shelf-life/products/${productId}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force_recalculate: forceRecalculate }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to calculate shelf life')
  }

  return response.json()
}

/**
 * Fetch recalculation queue
 */
async function fetchRecalculationQueue(): Promise<RecalculationQueueResponse> {
  const response = await fetch('/api/technical/shelf-life/recalculation-queue')

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch recalculation queue')
  }

  return response.json()
}

/**
 * Bulk recalculate shelf life for multiple products
 */
async function bulkRecalculate(productIds?: string[]): Promise<BulkRecalculationResult> {
  const response = await fetch('/api/technical/shelf-life/bulk-recalculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_ids: productIds || [] }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to bulk recalculate shelf life')
  }

  return response.json()
}

/**
 * Fetch audit log for a product
 */
async function fetchAuditLog(
  productId: string,
  limit = 50,
  offset = 0
): Promise<ShelfLifeAuditLogResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  })

  const response = await fetch(
    `/api/technical/shelf-life/products/${productId}/audit?${params.toString()}`
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch audit log')
  }

  return response.json()
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch shelf life configuration for a product
 */
export function useShelfLifeConfig(productId: string | null) {
  return useQuery({
    queryKey: shelfLifeKeys.config(productId || ''),
    queryFn: () => fetchShelfLifeConfig(productId!),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to update shelf life configuration
 */
export function useUpdateShelfLifeConfig(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateShelfLifeRequest) => updateShelfLifeConfig(productId, data),
    onSuccess: () => {
      // Invalidate shelf life config
      queryClient.invalidateQueries({ queryKey: shelfLifeKeys.config(productId) })
      // Invalidate product queries as shelf_life_days may have changed
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Hook to calculate shelf life from BOM ingredients
 */
export function useCalculateShelfLife(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (forceRecalculate?: boolean) => calculateShelfLife(productId, forceRecalculate),
    onSuccess: () => {
      // Invalidate shelf life config
      queryClient.invalidateQueries({ queryKey: shelfLifeKeys.config(productId) })
      // Invalidate calculation cache
      queryClient.invalidateQueries({ queryKey: shelfLifeKeys.calculation(productId) })
      // Invalidate recalculation queue as this product was recalculated
      queryClient.invalidateQueries({ queryKey: shelfLifeKeys.recalculationQueue() })
    },
  })
}

/**
 * Hook to fetch recalculation queue
 */
export function useRecalculationQueue() {
  return useQuery({
    queryKey: shelfLifeKeys.recalculationQueue(),
    queryFn: fetchRecalculationQueue,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to bulk recalculate shelf life
 */
export function useBulkRecalculate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productIds?: string[]) => bulkRecalculate(productIds),
    onSuccess: () => {
      // Invalidate all shelf life queries
      queryClient.invalidateQueries({ queryKey: shelfLifeKeys.all })
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Hook to fetch audit log for a product
 */
export function useShelfLifeAuditLog(productId: string | null, limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...shelfLifeKeys.auditLog(productId || ''), { limit, offset }],
    queryFn: () => fetchAuditLog(productId!, limit, offset),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
