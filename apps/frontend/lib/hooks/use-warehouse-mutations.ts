/**
 * React Hook: Warehouse Mutations
 * Story: 01.8 - Warehouses CRUD
 *
 * Provides mutations for warehouse CRUD operations
 * Uses React Query for cache invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Warehouse,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  CanDisableResult,
} from '@/lib/types/warehouse'

/**
 * Creates a new warehouse
 */
export function useCreateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateWarehouseInput): Promise<Warehouse> => {
      const response = await fetch('/api/v1/settings/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create warehouse')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })
}

/**
 * Updates an existing warehouse
 */
export function useUpdateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateWarehouseInput
    }): Promise<Warehouse> => {
      const response = await fetch(`/api/v1/settings/warehouses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update warehouse')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse', variables.id] })
    },
  })
}

/**
 * Deletes a warehouse (soft delete)
 */
export function useDeleteWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/v1/settings/warehouses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete warehouse')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })
}

/**
 * Sets a warehouse as default
 */
export function useSetDefaultWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Warehouse> => {
      const response = await fetch(`/api/v1/settings/warehouses/${id}/set-default`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to set default warehouse')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })
}

/**
 * Disables a warehouse
 */
export function useDisableWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Warehouse> => {
      const response = await fetch(`/api/v1/settings/warehouses/${id}/disable`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to disable warehouse')
      }

      return response.json()
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse', id] })
    },
  })
}

/**
 * Enables a disabled warehouse
 */
export function useEnableWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<Warehouse> => {
      const response = await fetch(`/api/v1/settings/warehouses/${id}/enable`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enable warehouse')
      }

      return response.json()
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse', id] })
    },
  })
}

/**
 * Validates warehouse code uniqueness
 */
export function useValidateWarehouseCode() {
  return useMutation({
    mutationFn: async ({
      code,
      excludeId,
    }: {
      code: string
      excludeId?: string
    }): Promise<{ available: boolean }> => {
      const params = new URLSearchParams({ code })
      if (excludeId) params.append('excludeId', excludeId)

      const response = await fetch(`/api/v1/settings/warehouses/validate-code?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to validate code')
      }

      return response.json()
    },
  })
}

/**
 * Checks if a warehouse can be disabled
 */
export function useCanDisableWarehouse() {
  return useMutation({
    mutationFn: async (id: string): Promise<CanDisableResult> => {
      const response = await fetch(`/api/v1/settings/warehouses/${id}/can-disable`)

      if (!response.ok) {
        throw new Error('Failed to check disable status')
      }

      return response.json()
    },
  })
}
