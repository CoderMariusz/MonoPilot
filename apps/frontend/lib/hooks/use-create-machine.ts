/**
 * useCreateMachine Hook
 * Story: 01.10 - Machines CRUD
 *
 * Creates a new machine via POST /api/v1/settings/machines
 * Uses React Query mutation with cache invalidation
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateMachineInput, Machine } from '@/lib/types/machine'

/**
 * Hook for creating a new machine
 * @returns useMutation result with mutateAsync and isPending
 */
export function useCreateMachine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMachineInput): Promise<Machine> => {
      const response = await fetch('/api/v1/settings/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create machine')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] })
    },
  })
}
