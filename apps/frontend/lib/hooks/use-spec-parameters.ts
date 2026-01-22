/**
 * React Query Hooks for Quality Spec Parameters (Story 06.4)
 *
 * Provides hooks for:
 * - useSpecParameters: List parameters for a specification
 * - useCreateParameter: Create parameter mutation
 * - useUpdateParameter: Update parameter mutation
 * - useDeleteParameter: Delete parameter mutation
 * - useReorderParameters: Reorder parameters mutation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  QualitySpecParameter,
  ParametersListResponse,
  CreateParameterRequest,
  UpdateParameterRequest,
  ReorderParametersResponse,
} from '@/lib/types/quality'
import { specificationKeys } from './use-specifications'

// Query keys for cache management
export const parameterKeys = {
  all: ['spec-parameters'] as const,
  lists: () => [...parameterKeys.all, 'list'] as const,
  list: (specId: string) => [...parameterKeys.lists(), specId] as const,
}

/**
 * Fetch parameters for a specification
 */
async function fetchParameters(specId: string): Promise<ParametersListResponse> {
  const response = await fetch(`/api/quality/specifications/${specId}/parameters`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Specification not found')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch parameters')
  }

  return response.json()
}

/**
 * Create parameter API call
 */
async function createParameterApi(params: {
  specId: string
  data: CreateParameterRequest
}): Promise<{ parameter: QualitySpecParameter }> {
  const response = await fetch(`/api/quality/specifications/${params.specId}/parameters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to create parameter')
  }

  return response.json()
}

/**
 * Update parameter API call
 */
async function updateParameterApi(params: {
  specId: string
  parameterId: string
  data: UpdateParameterRequest
}): Promise<{ parameter: QualitySpecParameter }> {
  const response = await fetch(
    `/api/quality/specifications/${params.specId}/parameters/${params.parameterId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.data),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to update parameter')
  }

  return response.json()
}

/**
 * Delete parameter API call
 */
async function deleteParameterApi(params: {
  specId: string
  parameterId: string
}): Promise<void> {
  const response = await fetch(
    `/api/quality/specifications/${params.specId}/parameters/${params.parameterId}`,
    { method: 'DELETE' }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to delete parameter')
  }
}

/**
 * Reorder parameters API call
 */
async function reorderParametersApi(params: {
  specId: string
  parameterIds: string[]
}): Promise<ReorderParametersResponse> {
  const response = await fetch(
    `/api/quality/specifications/${params.specId}/parameters/reorder`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parameter_ids: params.parameterIds }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to reorder parameters')
  }

  return response.json()
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Get parameters for a specification
 */
export function useSpecParameters(specId: string | null) {
  return useQuery({
    queryKey: parameterKeys.list(specId || ''),
    queryFn: () => fetchParameters(specId!),
    enabled: !!specId,
    staleTime: 30000,
  })
}

/**
 * Create new parameter mutation
 */
export function useCreateParameter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createParameterApi,
    onSuccess: (_data, variables) => {
      // Invalidate parameters list for this spec
      queryClient.invalidateQueries({ queryKey: parameterKeys.list(variables.specId) })
      // Also invalidate spec detail (parameters_count changed)
      queryClient.invalidateQueries({ queryKey: specificationKeys.detail(variables.specId) })
    },
  })
}

/**
 * Update parameter mutation
 */
export function useUpdateParameter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateParameterApi,
    onSuccess: (_data, variables) => {
      // Invalidate parameters list for this spec
      queryClient.invalidateQueries({ queryKey: parameterKeys.list(variables.specId) })
    },
  })
}

/**
 * Delete parameter mutation
 */
export function useDeleteParameter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteParameterApi,
    onSuccess: (_data, variables) => {
      // Invalidate parameters list for this spec
      queryClient.invalidateQueries({ queryKey: parameterKeys.list(variables.specId) })
      // Also invalidate spec detail (parameters_count changed)
      queryClient.invalidateQueries({ queryKey: specificationKeys.detail(variables.specId) })
    },
  })
}

/**
 * Reorder parameters mutation with optimistic update
 */
export function useReorderParameters() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reorderParametersApi,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: parameterKeys.list(variables.specId) })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<ParametersListResponse>(
        parameterKeys.list(variables.specId)
      )

      // Optimistically update to the new order
      if (previousData) {
        const reorderedParams = variables.parameterIds
          .map((id) => previousData.parameters.find((p) => p.id === id))
          .filter((p): p is QualitySpecParameter => p !== undefined)
          .map((p, index) => ({ ...p, sequence: index + 1 }))

        queryClient.setQueryData(parameterKeys.list(variables.specId), {
          ...previousData,
          parameters: reorderedParams,
        })
      }

      return { previousData }
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          parameterKeys.list(variables.specId),
          context.previousData
        )
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: parameterKeys.list(variables.specId) })
    },
  })
}
