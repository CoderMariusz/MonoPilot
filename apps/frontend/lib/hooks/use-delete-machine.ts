/**
 * useDeleteMachine Hook
 * Story: 01.10 - Machines CRUD
 *
 * Deletes a machine via DELETE /api/v1/settings/machines/:id
 * Uses React Query mutation with cache invalidation
 *
 * Business Rules:
 * - Returns 409 if machine is assigned to production line
 * - Performs soft delete for audit trail
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Hook for deleting a machine
 * @returns useMutation result with mutateAsync and isPending
 */
export function useDeleteMachine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (machineId: string): Promise<void> => {
      const response = await fetch(`/api/v1/settings/machines/${machineId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete machine')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] })
    },
  })
}
