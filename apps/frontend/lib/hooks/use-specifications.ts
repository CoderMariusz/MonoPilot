/**
 * React Query Hooks for Quality Specifications Management (Story 06.3)
 *
 * Provides hooks for:
 * - useSpecifications: List specifications with filters
 * - useSpecification: Single specification query
 * - useCreateSpecification: Create mutation
 * - useUpdateSpecification: Update mutation
 * - useDeleteSpecification: Delete mutation
 * - useApproveSpecification: Approve mutation
 * - useCloneSpecification: Clone mutation
 * - useCompleteReview: Complete review mutation
 * - useProductSpecifications: Specs for a product
 * - useActiveSpecification: Active spec for a product
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  QualitySpecification,
  SpecificationsListResponse,
  SpecificationDetailResponse,
  SpecificationListParams,
  CreateSpecificationInput,
  UpdateSpecificationInput,
  ApproveSpecificationAPIResponse,
  CloneSpecificationResponse,
  CompleteReviewResponse,
  ProductSpecificationsResponse,
  ActiveSpecificationResponse,
} from '@/lib/types/quality'

// Query keys for cache management
export const specificationKeys = {
  all: ['specifications'] as const,
  lists: () => [...specificationKeys.all, 'list'] as const,
  list: (params: SpecificationListParams) => [...specificationKeys.lists(), params] as const,
  details: () => [...specificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...specificationKeys.details(), id] as const,
  productSpecs: () => [...specificationKeys.all, 'product'] as const,
  productSpec: (productId: string) => [...specificationKeys.productSpecs(), productId] as const,
  activeSpec: (productId: string) => [...specificationKeys.productSpecs(), productId, 'active'] as const,
}

/**
 * Fetch specifications list with filters
 */
async function fetchSpecifications(params: SpecificationListParams): Promise<SpecificationsListResponse> {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())
  if (params.status) searchParams.append('status', params.status)
  if (params.product_id) searchParams.append('product_id', params.product_id)
  if (params.search) searchParams.append('search', params.search)
  if (params.sort_by) searchParams.append('sort_by', params.sort_by)
  if (params.sort_order) searchParams.append('sort_order', params.sort_order)

  const url = `/api/quality/specifications${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch specifications')
  }

  return response.json()
}

/**
 * Fetch single specification by ID
 */
async function fetchSpecification(id: string): Promise<SpecificationDetailResponse> {
  const response = await fetch(`/api/quality/specifications/${id}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Specification not found')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch specification')
  }

  return response.json()
}

/**
 * Fetch specifications for a product
 */
async function fetchProductSpecifications(productId: string): Promise<ProductSpecificationsResponse> {
  const response = await fetch(`/api/quality/specifications/product/${productId}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch product specifications')
  }

  return response.json()
}

/**
 * Fetch active specification for a product
 */
async function fetchActiveSpecification(productId: string): Promise<ActiveSpecificationResponse> {
  const response = await fetch(`/api/quality/specifications/product/${productId}/active`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No active specification found for this product')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch active specification')
  }

  return response.json()
}

/**
 * Create specification API call
 */
async function createSpecificationApi(input: CreateSpecificationInput): Promise<{ specification: QualitySpecification }> {
  const response = await fetch('/api/quality/specifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to create specification')
  }

  return response.json()
}

/**
 * Update specification API call
 */
async function updateSpecificationApi(params: { id: string; data: UpdateSpecificationInput }): Promise<{ specification: QualitySpecification }> {
  const response = await fetch(`/api/quality/specifications/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to update specification')
  }

  return response.json()
}

/**
 * Delete specification API call
 */
async function deleteSpecificationApi(id: string): Promise<void> {
  const response = await fetch(`/api/quality/specifications/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to delete specification')
  }
}

/**
 * Approve specification API call
 */
async function approveSpecificationApi(params: { id: string; notes?: string }): Promise<ApproveSpecificationAPIResponse> {
  const response = await fetch(`/api/quality/specifications/${params.id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approval_notes: params.notes }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to approve specification')
  }

  return response.json()
}

/**
 * Clone specification API call
 */
async function cloneSpecificationApi(id: string): Promise<CloneSpecificationResponse> {
  const response = await fetch(`/api/quality/specifications/${id}/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to clone specification')
  }

  return response.json()
}

/**
 * Complete review API call
 */
async function completeReviewApi(params: { id: string; notes?: string }): Promise<CompleteReviewResponse> {
  const response = await fetch(`/api/quality/specifications/${params.id}/complete-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_notes: params.notes }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to complete review')
  }

  return response.json()
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * List specifications with filters, pagination, and sorting
 */
export function useSpecifications(params: SpecificationListParams = {}) {
  return useQuery({
    queryKey: specificationKeys.list(params),
    queryFn: () => fetchSpecifications(params),
    staleTime: 30000, // 30 seconds
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Get single specification by ID
 */
export function useSpecification(id: string | null) {
  return useQuery({
    queryKey: specificationKeys.detail(id || ''),
    queryFn: () => fetchSpecification(id!),
    enabled: !!id,
    staleTime: 30000,
  })
}

/**
 * Get specifications for a product
 */
export function useProductSpecifications(productId: string | null) {
  return useQuery({
    queryKey: specificationKeys.productSpec(productId || ''),
    queryFn: () => fetchProductSpecifications(productId!),
    enabled: !!productId,
    staleTime: 30000,
  })
}

/**
 * Get active specification for a product
 */
export function useActiveSpecification(productId: string | null) {
  return useQuery({
    queryKey: specificationKeys.activeSpec(productId || ''),
    queryFn: () => fetchActiveSpecification(productId!),
    enabled: !!productId,
    staleTime: 30000,
    retry: false, // Don't retry 404s
  })
}

/**
 * Create new specification mutation
 */
export function useCreateSpecification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSpecificationApi,
    onSuccess: (data) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: specificationKeys.lists() })
      // Invalidate product specs
      if (data.specification.product_id) {
        queryClient.invalidateQueries({ queryKey: specificationKeys.productSpec(data.specification.product_id) })
      }
    },
  })
}

/**
 * Update specification mutation
 */
export function useUpdateSpecification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSpecificationApi,
    onSuccess: (data) => {
      // Update cache for this specific specification
      queryClient.setQueryData(specificationKeys.detail(data.specification.id), { specification: data.specification })
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: specificationKeys.lists() })
    },
  })
}

/**
 * Delete specification mutation
 */
export function useDeleteSpecification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSpecificationApi,
    onSuccess: (_result, specId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: specificationKeys.detail(specId) })
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: specificationKeys.lists() })
    },
  })
}

/**
 * Approve specification mutation
 */
export function useApproveSpecification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveSpecificationApi,
    onSuccess: (data) => {
      // Update cache for this specific specification
      queryClient.setQueryData(specificationKeys.detail(data.specification.id), { specification: data.specification })
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: specificationKeys.lists() })
      // Invalidate product specs and active spec
      if (data.specification.product_id) {
        queryClient.invalidateQueries({ queryKey: specificationKeys.productSpec(data.specification.product_id) })
        queryClient.invalidateQueries({ queryKey: specificationKeys.activeSpec(data.specification.product_id) })
      }
    },
  })
}

/**
 * Clone specification mutation
 */
export function useCloneSpecification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cloneSpecificationApi,
    onSuccess: (data) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: specificationKeys.lists() })
      // Invalidate product specs
      if (data.specification.product_id) {
        queryClient.invalidateQueries({ queryKey: specificationKeys.productSpec(data.specification.product_id) })
      }
    },
  })
}

/**
 * Complete review mutation
 */
export function useCompleteReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completeReviewApi,
    onSuccess: (data) => {
      // Update cache for this specific specification
      queryClient.setQueryData(specificationKeys.detail(data.specification.id), { specification: data.specification })
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: specificationKeys.lists() })
    },
  })
}
