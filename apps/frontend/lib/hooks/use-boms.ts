/**
 * React Query Hooks for BOM Management (Story 02.4)
 *
 * Provides hooks for:
 * - useBOMs: List BOMs with filters
 * - useBOM: Single BOM query
 * - useCreateBOM: Create mutation
 * - useUpdateBOM: Update mutation
 * - useDeleteBOM: Delete mutation
 * - useBOMTimeline: Timeline query for product
 * - useNextBOMVersion: Next version number query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  BOMWithProduct,
  BOMsListResponse,
  BOMFilters,
  CreateBOMRequest,
  UpdateBOMRequest,
  BOMTimelineResponse,
} from '@/lib/types/bom'

// Query keys for cache management
export const bomKeys = {
  all: ['boms'] as const,
  lists: () => [...bomKeys.all, 'list'] as const,
  list: (filters: BOMFilters) => [...bomKeys.lists(), filters] as const,
  details: () => [...bomKeys.all, 'detail'] as const,
  detail: (id: string) => [...bomKeys.details(), id] as const,
  timelines: () => [...bomKeys.all, 'timeline'] as const,
  timeline: (productId: string) => [...bomKeys.timelines(), productId] as const,
  nextVersion: (productId: string) => [...bomKeys.all, 'nextVersion', productId] as const,
}

/**
 * Fetch BOMs list with filters
 */
async function fetchBOMs(filters: BOMFilters): Promise<BOMsListResponse> {
  const params = new URLSearchParams()

  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.search) params.append('search', filters.search)
  if (filters.status) params.append('status', filters.status)
  if (filters.product_type) params.append('product_type', filters.product_type)
  if (filters.effective_date) params.append('effective_date', filters.effective_date)
  if (filters.product_id) params.append('product_id', filters.product_id)
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

  const url = `/api/technical/boms${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch BOMs')
  }

  const data = await response.json()
  return {
    boms: data.boms || [],
    total: data.total || 0,
    page: filters.page || 1,
    limit: filters.limit || 50,
  }
}

/**
 * Fetch single BOM by ID
 */
async function fetchBOM(id: string): Promise<BOMWithProduct> {
  const response = await fetch(`/api/technical/boms/${id}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('BOM not found')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch BOM')
  }

  const data = await response.json()
  return data.bom
}

/**
 * Fetch BOM timeline for a product
 */
async function fetchBOMTimeline(productId: string): Promise<BOMTimelineResponse> {
  const response = await fetch(`/api/technical/boms/timeline?product_id=${productId}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch BOM timeline')
  }

  const data = await response.json()
  return {
    product: data.product,
    versions: data.timeline?.boms?.map((bom: any) => ({
      id: bom.id,
      version: bom.version,
      status: bom.status.toLowerCase().replace(' ', '_'),
      effective_from: bom.effective_from,
      effective_to: bom.effective_to,
      output_qty: bom.output_qty || 1,
      output_uom: bom.output_uom || 'EA',
      notes: bom.notes || null,
      is_currently_active: false, // Will be calculated client-side
      has_overlap: false, // Will be calculated client-side
    })) || [],
    current_date: new Date().toISOString().split('T')[0],
  }
}

/**
 * Fetch next version number for a product
 */
async function fetchNextVersion(productId: string): Promise<number> {
  const response = await fetch(`/api/technical/boms?product_id=${productId}&limit=1&sortBy=version&sortOrder=desc`)

  if (!response.ok) {
    return 1 // Default to version 1 if error
  }

  const data = await response.json()
  if (!data.boms || data.boms.length === 0) {
    return 1
  }

  return (data.boms[0].version || 0) + 1
}

/**
 * Create BOM API call
 */
async function createBOMApi(input: CreateBOMRequest): Promise<BOMWithProduct> {
  const response = await fetch('/api/technical/boms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to create BOM')
  }

  const data = await response.json()
  return data.bom
}

/**
 * Update BOM API call
 */
async function updateBOMApi(params: { id: string; data: UpdateBOMRequest }): Promise<BOMWithProduct> {
  const response = await fetch(`/api/technical/boms/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to update BOM')
  }

  const data = await response.json()
  return data.bom
}

/**
 * Delete BOM API call
 */
async function deleteBOMApi(id: string): Promise<void> {
  const response = await fetch(`/api/technical/boms/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to delete BOM')
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * List BOMs with filters, pagination, and sorting
 */
export function useBOMs(filters: BOMFilters = {}) {
  return useQuery({
    queryKey: bomKeys.list(filters),
    queryFn: () => fetchBOMs(filters),
    staleTime: 30000, // 30 seconds
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Get single BOM by ID
 */
export function useBOM(id: string | null) {
  return useQuery({
    queryKey: bomKeys.detail(id || ''),
    queryFn: () => fetchBOM(id!),
    enabled: !!id,
    staleTime: 30000,
  })
}

/**
 * Get BOM timeline for a product
 */
export function useBOMTimeline(productId: string | null) {
  return useQuery({
    queryKey: bomKeys.timeline(productId || ''),
    queryFn: () => fetchBOMTimeline(productId!),
    enabled: !!productId,
    staleTime: 30000,
  })
}

/**
 * Get next version number for a product
 */
export function useNextBOMVersion(productId: string | null) {
  return useQuery({
    queryKey: bomKeys.nextVersion(productId || ''),
    queryFn: () => fetchNextVersion(productId!),
    enabled: !!productId,
    staleTime: 10000, // 10 seconds - fresher data for version
  })
}

/**
 * Create new BOM mutation
 */
export function useCreateBOM() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBOMApi,
    onSuccess: (newBom) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() })
      // Invalidate timeline for the product
      queryClient.invalidateQueries({ queryKey: bomKeys.timeline(newBom.product_id) })
      // Invalidate next version
      queryClient.invalidateQueries({ queryKey: bomKeys.nextVersion(newBom.product_id) })
    },
  })
}

/**
 * Update BOM mutation
 */
export function useUpdateBOM() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateBOMApi,
    onSuccess: (updatedBom) => {
      // Update cache for this specific BOM
      queryClient.setQueryData(bomKeys.detail(updatedBom.id), updatedBom)
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() })
      // Invalidate timeline for the product
      queryClient.invalidateQueries({ queryKey: bomKeys.timeline(updatedBom.product_id) })
    },
  })
}

/**
 * Delete BOM mutation
 */
export function useDeleteBOM() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBOMApi,
    onSuccess: (_result, bomId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: bomKeys.detail(bomId) })
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() })
      // Invalidate all timelines (we don't know the product_id here)
      queryClient.invalidateQueries({ queryKey: bomKeys.timelines() })
    },
  })
}
