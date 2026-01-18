/**
 * React Hook: Expiring Items
 * Story: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * React Query hook for expiring inventory management
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchExpiringItems,
  executeBulkAction,
  exportExpiringToCSV,
  type ExpiryFilters,
} from '@/lib/api/expiring-items-api'
import type { ExpiryTier, BulkExpiryAction } from '@/lib/validation/expiry-alert-schema'
import { useToast } from '@/hooks/use-toast'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const expiringItemsKeys = {
  all: ['expiring-items'] as const,
  list: (
    days: number,
    tier: ExpiryTier | 'all',
    filters: ExpiryFilters,
    page: number,
    limit: number
  ) => [...expiringItemsKeys.all, 'list', { days, tier, filters, page, limit }] as const,
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseExpiringItemsReturn {
  // State
  days: number
  setDays: (days: number) => void
  debouncedDays: number
  tierFilter: ExpiryTier | 'all'
  setTierFilter: (tier: ExpiryTier | 'all') => void
  filters: ExpiryFilters
  setFilters: (filters: ExpiryFilters) => void
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  page: number
  setPage: (page: number) => void
  limit: number

  // Query state
  data: Awaited<ReturnType<typeof fetchExpiringItems>> | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void

  // Actions
  handleBulkAction: (action: BulkExpiryAction['action']) => Promise<void>
  handleExportCSV: () => Promise<void>
  clearSelection: () => void
  selectAll: () => void
  toggleSelection: (id: string) => void
  isSelected: (id: string) => boolean
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useExpiringItems(): UseExpiringItemsReturn {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // State management
  const [days, setDaysState] = useState(30)
  const [debouncedDays, setDebouncedDays] = useState(30)
  const [tierFilter, setTierFilter] = useState<ExpiryTier | 'all'>('all')
  const [filters, setFilters] = useState<ExpiryFilters>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const limit = 50

  // Debounce days slider
  const setDays = useCallback((value: number) => {
    setDaysState(value)
    // Debounce the actual query update
    const timeoutId = setTimeout(() => {
      setDebouncedDays(value)
      setPage(1) // Reset to page 1 when changing days
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [])

  // Query for expiring items
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: expiringItemsKeys.list(debouncedDays, tierFilter, filters, page, limit),
    queryFn: () => fetchExpiringItems(debouncedDays, tierFilter, filters, page, limit),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: ({ action, lpIds }: { action: BulkExpiryAction['action']; lpIds: string[] }) =>
      executeBulkAction(action, lpIds),
    onSuccess: (result) => {
      toast({
        title: 'Action completed',
        description: result.message || 'Bulk action completed successfully',
      })
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: expiringItemsKeys.all })
    },
    onError: (error: Error) => {
      toast({
        title: 'Action failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: () => exportExpiringToCSV(debouncedDays),
    onSuccess: () => {
      toast({
        title: 'Export started',
        description: 'Your CSV file is being downloaded',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Action handlers
  const handleBulkAction = useCallback(
    async (action: BulkExpiryAction['action']) => {
      if (selectedIds.length === 0) {
        toast({
          title: 'No items selected',
          description: 'Please select at least one item to perform this action',
          variant: 'destructive',
        })
        return
      }
      await bulkActionMutation.mutateAsync({ action, lpIds: selectedIds })
    },
    [selectedIds, bulkActionMutation, toast]
  )

  const handleExportCSV = useCallback(async () => {
    await exportMutation.mutateAsync()
  }, [exportMutation])

  // Selection helpers
  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  const selectAll = useCallback(() => {
    if (data?.data) {
      setSelectedIds(data.data.map((item) => item.lp_id))
    }
  }, [data?.data])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  )

  // Reset selections when filters change
  const handleSetTierFilter = useCallback((tier: ExpiryTier | 'all') => {
    setTierFilter(tier)
    setPage(1)
    setSelectedIds([])
  }, [])

  const handleSetFilters = useCallback((newFilters: ExpiryFilters) => {
    setFilters(newFilters)
    setPage(1)
    setSelectedIds([])
  }, [])

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage)
    setSelectedIds([])
  }, [])

  return {
    // State
    days,
    setDays,
    debouncedDays,
    tierFilter,
    setTierFilter: handleSetTierFilter,
    filters,
    setFilters: handleSetFilters,
    selectedIds,
    setSelectedIds,
    page,
    setPage: handleSetPage,
    limit,

    // Query state
    data,
    isLoading,
    error: error as Error | null,
    refetch,

    // Actions
    handleBulkAction,
    handleExportCSV,
    clearSelection,
    selectAll,
    toggleSelection,
    isSelected,
  }
}
