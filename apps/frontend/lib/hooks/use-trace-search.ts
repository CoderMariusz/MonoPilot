/**
 * React Hook: Traceability Search
 * Story 02.10b: Traceability Queries UI
 *
 * React Query hooks for forward/backward trace operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TraceResult, RecallSimulationResult } from '@/lib/types/traceability'

// ============================================================================
// TYPES
// ============================================================================

export interface TraceSearchInput {
  lp_id?: string
  batch_number?: string
  max_depth?: number
}

export interface RecallSearchInput extends TraceSearchInput {
  include_shipped?: boolean
  include_notifications?: boolean
}

export type TraceDirection = 'forward' | 'backward'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const traceSearchKeys = {
  all: ['trace-search'] as const,
  forward: (input: TraceSearchInput) => [...traceSearchKeys.all, 'forward', input] as const,
  backward: (input: TraceSearchInput) => [...traceSearchKeys.all, 'backward', input] as const,
  recall: (input: RecallSearchInput) => [...traceSearchKeys.all, 'recall', input] as const,
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook for running trace search (forward or backward)
 */
export function useTraceSearch(direction: TraceDirection) {
  const queryClient = useQueryClient()

  return useMutation<TraceResult, Error, TraceSearchInput>({
    mutationFn: async (input: TraceSearchInput): Promise<TraceResult> => {
      if (!input.lp_id && !input.batch_number) {
        throw new Error('Either LP ID or batch number is required')
      }

      const response = await fetch(`/api/technical/tracing/${direction}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_id: input.lp_id || undefined,
          batch_number: input.batch_number || undefined,
          max_depth: input.max_depth || 20,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Trace failed with status ${response.status}`)
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Cache the result
      queryClient.setQueryData(
        direction === 'forward'
          ? traceSearchKeys.forward(variables)
          : traceSearchKeys.backward(variables),
        data
      )
    },
  })
}

/**
 * Hook for running recall simulation
 */
export function useRecallSimulation() {
  const queryClient = useQueryClient()

  return useMutation<RecallSimulationResult, Error, RecallSearchInput>({
    mutationFn: async (input: RecallSearchInput): Promise<RecallSimulationResult> => {
      if (!input.lp_id && !input.batch_number) {
        throw new Error('Either LP ID or batch number is required')
      }

      const response = await fetch('/api/technical/tracing/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_id: input.lp_id || undefined,
          batch_number: input.batch_number || undefined,
          max_depth: input.max_depth || 20,
          include_shipped: input.include_shipped ?? true,
          include_notifications: input.include_notifications ?? true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Recall simulation failed with status ${response.status}`)
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(traceSearchKeys.recall(variables), data)
    },
  })
}
