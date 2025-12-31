/**
 * React Query Mutations: Transfer Order CRUD
 * Story 03.8: Transfer Orders CRUD + Lines
 *
 * Provides mutations for:
 * - Create transfer order
 * - Update transfer order
 * - Delete transfer order
 * - Release transfer order (draft -> planned)
 * - Cancel transfer order
 * - Add TO line
 * - Update TO line
 * - Delete TO line
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  TransferOrder,
  TransferOrderLine,
  CreateTOInput,
  UpdateTOInput,
  CreateTOLineInput,
  UpdateTOLineInput,
} from '@/lib/types/transfer-order'
import { transferOrderKeys } from './use-transfer-orders'

// ============================================================================
// API FUNCTIONS - Transfer Order
// ============================================================================

/**
 * Create transfer order
 */
async function createTransferOrder(input: CreateTOInput): Promise<TransferOrder> {
  const response = await fetch('/api/planning/transfer-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to create transfer order')
  }

  const data = await response.json()
  return data.transfer_order || data.data || data
}

/**
 * Update transfer order
 */
async function updateTransferOrder(params: {
  id: string
  data: UpdateTOInput
}): Promise<TransferOrder> {
  const response = await fetch(`/api/planning/transfer-orders/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to update transfer order')
  }

  const data = await response.json()
  return data.transfer_order || data.data || data
}

/**
 * Delete transfer order
 */
async function deleteTransferOrder(id: string): Promise<void> {
  const response = await fetch(`/api/planning/transfer-orders/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to delete transfer order')
  }
}

/**
 * Release transfer order (draft -> planned)
 */
async function releaseTransferOrder(params: {
  id: string
  notes?: string
}): Promise<TransferOrder> {
  const response = await fetch(`/api/planning/transfer-orders/${params.id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'planned', notes: params.notes }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to release transfer order')
  }

  const data = await response.json()
  return data.transfer_order || data.data || data
}

/**
 * Cancel transfer order
 */
async function cancelTransferOrder(params: {
  id: string
  reason?: string
}): Promise<TransferOrder> {
  const response = await fetch(`/api/planning/transfer-orders/${params.id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled', reason: params.reason }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to cancel transfer order')
  }

  const data = await response.json()
  return data.transfer_order || data.data || data
}

// ============================================================================
// API FUNCTIONS - TO Lines
// ============================================================================

/**
 * Add TO line
 */
async function addTOLine(params: {
  toId: string
  data: CreateTOLineInput
}): Promise<TransferOrderLine> {
  const response = await fetch(`/api/planning/transfer-orders/${params.toId}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to add line')
  }

  const data = await response.json()
  return data.line || data.data || data
}

/**
 * Update TO line
 */
async function updateTOLine(params: {
  toId: string
  lineId: string
  data: UpdateTOLineInput
}): Promise<TransferOrderLine> {
  const response = await fetch(
    `/api/planning/transfer-orders/${params.toId}/lines/${params.lineId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.data),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to update line')
  }

  const data = await response.json()
  return data.line || data.data || data
}

/**
 * Delete TO line
 */
async function deleteTOLine(params: { toId: string; lineId: string }): Promise<void> {
  const response = await fetch(
    `/api/planning/transfer-orders/${params.toId}/lines/${params.lineId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || error.message || 'Failed to delete line')
  }
}

// ============================================================================
// MUTATION HOOKS - Transfer Order
// ============================================================================

/**
 * Hook to create a new transfer order
 */
export function useCreateTransferOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTransferOrder,
    onSuccess: () => {
      // Invalidate all transfer order lists
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.lists() })
      // Invalidate summary
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.summary() })
    },
  })
}

/**
 * Hook to update a transfer order
 */
export function useUpdateTransferOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTransferOrder,
    onSuccess: (updatedTO) => {
      // Update the specific transfer order in cache
      queryClient.setQueryData(transferOrderKeys.detail(updatedTO.id), updatedTO)
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.lists() })
      // Invalidate summary
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.summary() })
    },
  })
}

/**
 * Hook to delete a transfer order
 */
export function useDeleteTransferOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTransferOrder,
    onSuccess: (_result, toId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: transferOrderKeys.detail(toId) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.lists() })
      // Invalidate summary
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.summary() })
    },
  })
}

/**
 * Hook to release a transfer order (draft -> planned)
 */
export function useReleaseTransferOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: releaseTransferOrder,
    onSuccess: (updatedTO) => {
      queryClient.setQueryData(transferOrderKeys.detail(updatedTO.id), updatedTO)
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.summary() })
    },
  })
}

/**
 * Hook to cancel a transfer order
 */
export function useCancelTransferOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelTransferOrder,
    onSuccess: (updatedTO) => {
      queryClient.setQueryData(transferOrderKeys.detail(updatedTO.id), updatedTO)
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.summary() })
    },
  })
}

// ============================================================================
// MUTATION HOOKS - TO Lines
// ============================================================================

/**
 * Hook to add a TO line
 */
export function useAddTOLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addTOLine,
    onSuccess: (_result, params) => {
      // Invalidate the specific TO detail
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.detail(params.toId) })
      // Invalidate lists (lines count may change)
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.lists() })
    },
  })
}

/**
 * Hook to update a TO line
 */
export function useUpdateTOLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTOLine,
    onSuccess: (_result, params) => {
      // Invalidate the specific TO detail
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.detail(params.toId) })
    },
  })
}

/**
 * Hook to delete a TO line
 */
export function useDeleteTOLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTOLine,
    onSuccess: (_result, params) => {
      // Invalidate the specific TO detail
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.detail(params.toId) })
      // Invalidate lists (lines count may change)
      queryClient.invalidateQueries({ queryKey: transferOrderKeys.lists() })
    },
  })
}
