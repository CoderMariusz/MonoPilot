/**
 * React Query Mutations: Work Order CRUD
 * Story 03.10: Work Order CRUD Operations
 *
 * Provides mutations for:
 * - Create work order
 * - Update work order
 * - Delete work order
 * - Plan work order (draft -> planned)
 * - Release work order (planned -> released)
 * - Cancel work order
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  WorkOrder,
  CreateWOInput,
  UpdateWOInput,
} from '@/lib/types/work-order'
import { workOrderKeys } from './use-work-orders'

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Create work order
 */
async function createWorkOrder(input: CreateWOInput): Promise<WorkOrder> {
  const response = await fetch('/api/planning/work-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || error.message || 'Failed to create work order')
  }

  const data = await response.json()
  return data.data || data.work_order || data
}

/**
 * Update work order
 */
async function updateWorkOrder(params: {
  id: string
  data: UpdateWOInput
}): Promise<WorkOrder> {
  const response = await fetch(`/api/planning/work-orders/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || error.message || 'Failed to update work order')
  }

  const data = await response.json()
  return data.data || data.work_order || data
}

/**
 * Delete work order
 */
async function deleteWorkOrder(id: string): Promise<void> {
  const response = await fetch(`/api/planning/work-orders/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || error.message || 'Failed to delete work order')
  }
}

/**
 * Plan work order (draft -> planned)
 */
async function planWorkOrder(params: {
  id: string
  notes?: string
}): Promise<WorkOrder> {
  const response = await fetch(`/api/planning/work-orders/${params.id}/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: params.notes }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || error.message || 'Failed to plan work order')
  }

  const data = await response.json()
  return data.data || data.work_order || data
}

/**
 * Release work order (planned -> released)
 */
async function releaseWorkOrder(params: {
  id: string
  notes?: string
}): Promise<WorkOrder> {
  const response = await fetch(`/api/planning/work-orders/${params.id}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: params.notes }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || error.message || 'Failed to release work order')
  }

  const data = await response.json()
  return data.data || data.work_order || data
}

/**
 * Cancel work order
 */
async function cancelWorkOrder(params: {
  id: string
  reason?: string
}): Promise<WorkOrder> {
  const response = await fetch(`/api/planning/work-orders/${params.id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: params.reason }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || error.message || 'Failed to cancel work order')
  }

  const data = await response.json()
  return data.data || data.work_order || data
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new work order
 */
export function useCreateWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      // Invalidate all work order lists
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
      // Invalidate summary
      queryClient.invalidateQueries({ queryKey: workOrderKeys.summary() })
    },
  })
}

/**
 * Hook to update a work order
 */
export function useUpdateWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWorkOrder,
    onSuccess: (updatedWO) => {
      // Update the specific work order in cache
      queryClient.setQueryData(workOrderKeys.detail(updatedWO.id), updatedWO)
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
      // Invalidate summary
      queryClient.invalidateQueries({ queryKey: workOrderKeys.summary() })
    },
  })
}

/**
 * Hook to delete a work order
 */
export function useDeleteWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWorkOrder,
    onSuccess: (_result, woId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: workOrderKeys.detail(woId) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
      // Invalidate summary
      queryClient.invalidateQueries({ queryKey: workOrderKeys.summary() })
    },
  })
}

/**
 * Hook to plan a work order (draft -> planned)
 */
export function usePlanWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: planWorkOrder,
    onSuccess: (updatedWO) => {
      queryClient.setQueryData(workOrderKeys.detail(updatedWO.id), updatedWO)
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.summary() })
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.statusHistory(updatedWO.id),
      })
    },
  })
}

/**
 * Hook to release a work order (planned -> released)
 */
export function useReleaseWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: releaseWorkOrder,
    onSuccess: (updatedWO) => {
      queryClient.setQueryData(workOrderKeys.detail(updatedWO.id), updatedWO)
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.summary() })
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.statusHistory(updatedWO.id),
      })
    },
  })
}

/**
 * Hook to cancel a work order
 */
export function useCancelWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelWorkOrder,
    onSuccess: (updatedWO) => {
      queryClient.setQueryData(workOrderKeys.detail(updatedWO.id), updatedWO)
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.summary() })
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.statusHistory(updatedWO.id),
      })
    },
  })
}
