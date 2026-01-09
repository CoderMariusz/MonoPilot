/**
 * useUpdateMachine Hook
 * Story: 01.10 - Machines CRUD
 *
 * Updates an existing machine via PUT /api/v1/settings/machines/:id
 * Uses React Query mutation with cache invalidation
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpdateMachineInput, Machine } from '@/lib/types/machine'

/**
 * Hook for updating an existing machine
 * @returns useMutation result with mutateAsync and isPending
 */
export function useUpdateMachine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: UpdateMachineInput
    }): Promise<Machine> => {
      const response = await fetch(`/api/v1/settings/machines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update machine')
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['machines'] })
      queryClient.invalidateQueries({ queryKey: ['machine', variables.id] })
    },
  })
}
