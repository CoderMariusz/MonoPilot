/**
 * React Hook: Cycle Counts
 * Wireframe: WH-INV-001 - Cycle Counts Tab (Screen 5)
 * PRD: FR-023 (Cycle Count)
 */

'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type {
  CycleCountFilters,
  CycleCountsResponse,
  CreateCycleCountInput,
  UpdateCycleCountInput,
} from '@/lib/types/cycle-count'
import {
  fetchCycleCounts,
  createCycleCount,
  updateCycleCount,
  startCycleCount,
  completeCycleCount,
  cancelCycleCount,
} from '@/lib/api/cycle-counts-api'

// =============================================================================
// Query Keys
// =============================================================================

export const cycleCountKeys = {
  all: ['cycle-counts'] as const,
  lists: () => [...cycleCountKeys.all, 'list'] as const,
  list: (params: CycleCountFilters, page: number, limit: number) =>
    [...cycleCountKeys.lists(), params, page, limit] as const,
  details: () => [...cycleCountKeys.all, 'detail'] as const,
  detail: (id: string) => [...cycleCountKeys.details(), id] as const,
}

// =============================================================================
// Main Hook
// =============================================================================

export function useCycleCounts() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // State
  const [filters, setFilters] = useState<CycleCountFilters>({
    status: 'all',
    warehouse_id: undefined,
    type: undefined,
    date_from: undefined,
    date_to: undefined,
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(50)

  // Query
  const { data, isLoading, error, refetch } = useQuery<CycleCountsResponse>({
    queryKey: cycleCountKeys.list(filters, page, limit),
    queryFn: () => fetchCycleCounts(filters, page, limit),
    staleTime: 30000, // 30 seconds
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: CreateCycleCountInput) => createCycleCount(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleCountKeys.lists() })
      toast({
        title: 'Success',
        description: 'Cycle count created successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create cycle count',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCycleCountInput }) =>
      updateCycleCount(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleCountKeys.lists() })
      toast({
        title: 'Success',
        description: 'Cycle count updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update cycle count',
        variant: 'destructive',
      })
    },
  })

  const startMutation = useMutation({
    mutationFn: (id: string) => startCycleCount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleCountKeys.lists() })
      toast({
        title: 'Success',
        description: 'Cycle count started',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start cycle count',
        variant: 'destructive',
      })
    },
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeCycleCount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleCountKeys.lists() })
      toast({
        title: 'Success',
        description: 'Cycle count completed',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete cycle count',
        variant: 'destructive',
      })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelCycleCount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleCountKeys.lists() })
      toast({
        title: 'Success',
        description: 'Cycle count cancelled',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel cycle count',
        variant: 'destructive',
      })
    },
  })

  // Actions
  const handleFiltersChange = useCallback((newFilters: Partial<CycleCountFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1) // Reset to first page on filter change
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      warehouse_id: undefined,
      type: undefined,
      date_from: undefined,
      date_to: undefined,
    })
    setPage(1)
  }, [])

  return {
    // Data
    data: data?.data || [],
    summary: data?.summary || {
      planned_count: 0,
      in_progress_count: 0,
      completed_count: 0,
      with_variances_count: 0,
    },
    pagination: data?.pagination || { page: 1, limit: 50, total: 0, pages: 0 },

    // State
    filters,
    page,
    limit,
    isLoading,
    error,

    // Actions
    setFilters: handleFiltersChange,
    clearFilters,
    setPage,
    refetch,

    // Mutations
    createCycleCount: createMutation.mutate,
    updateCycleCount: updateMutation.mutate,
    startCycleCount: startMutation.mutate,
    completeCycleCount: completeMutation.mutate,
    cancelCycleCount: cancelMutation.mutate,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isStarting: startMutation.isPending,
    isCompleting: completeMutation.isPending,
    isCancelling: cancelMutation.isPending,
  }
}
