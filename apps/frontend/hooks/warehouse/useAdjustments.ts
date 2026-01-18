/**
 * React Hook: Stock Adjustments
 * Wireframe: WH-INV-001 - Adjustments Tab (Screen 6)
 * PRD: FR-024 (Stock Adjustment)
 */

'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type {
  AdjustmentFilters,
  AdjustmentsResponse,
  CreateAdjustmentInput,
  RejectAdjustmentInput,
} from '@/lib/types/adjustment'
import {
  fetchAdjustments,
  createAdjustment,
  approveAdjustment,
  rejectAdjustment,
} from '@/lib/api/adjustments-api'

// =============================================================================
// Query Keys
// =============================================================================

export const adjustmentKeys = {
  all: ['adjustments'] as const,
  lists: () => [...adjustmentKeys.all, 'list'] as const,
  list: (params: AdjustmentFilters, page: number, limit: number) =>
    [...adjustmentKeys.lists(), params, page, limit] as const,
  details: () => [...adjustmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...adjustmentKeys.details(), id] as const,
}

// =============================================================================
// Main Hook
// =============================================================================

export function useAdjustments() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // State
  const [filters, setFilters] = useState<AdjustmentFilters>({
    status: 'all',
    reason: undefined,
    adjusted_by: undefined,
    warehouse_id: undefined,
    date_from: undefined,
    date_to: undefined,
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(50)

  // Query
  const { data, isLoading, error, refetch } = useQuery<AdjustmentsResponse>({
    queryKey: adjustmentKeys.list(filters, page, limit),
    queryFn: () => fetchAdjustments(filters, page, limit),
    staleTime: 30000, // 30 seconds
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: CreateAdjustmentInput) => createAdjustment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adjustmentKeys.lists() })
      toast({
        title: 'Success',
        description: 'Adjustment created successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create adjustment',
        variant: 'destructive',
      })
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveAdjustment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adjustmentKeys.lists() })
      toast({
        title: 'Success',
        description: 'Adjustment approved',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve adjustment',
        variant: 'destructive',
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectAdjustment(id, { rejection_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adjustmentKeys.lists() })
      toast({
        title: 'Success',
        description: 'Adjustment rejected',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject adjustment',
        variant: 'destructive',
      })
    },
  })

  // Actions
  const handleFiltersChange = useCallback((newFilters: Partial<AdjustmentFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1) // Reset to first page on filter change
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      reason: undefined,
      adjusted_by: undefined,
      warehouse_id: undefined,
      date_from: undefined,
      date_to: undefined,
    })
    setPage(1)
  }, [])

  return {
    // Data
    data: data?.data || [],
    summary: data?.summary || {
      total_adjustments: 0,
      qty_increased: 0,
      qty_increased_value: 0,
      qty_decreased: 0,
      qty_decreased_value: 0,
      pending_approval: 0,
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
    createAdjustment: createMutation.mutate,
    approveAdjustment: approveMutation.mutate,
    rejectAdjustment: rejectMutation.mutate,

    // Mutation states
    isCreating: createMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  }
}
