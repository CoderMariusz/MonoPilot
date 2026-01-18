/**
 * useInventoryOverview Hook
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 *
 * Manages state and data fetching for the Inventory Overview Tab
 */

'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchInventoryOverview, exportInventoryCSV, exportInventoryExcel, downloadBlob } from '@/lib/api/inventory-api'
import type {
  InventoryGroupBy,
  InventoryFilters,
  InventoryByProduct,
  InventoryByLocation,
  InventoryByWarehouse,
  InventoryOverviewResponse,
} from '@/lib/types/inventory-overview'

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_FILTERS: InventoryFilters = {
  warehouse_id: undefined,
  location_id: undefined,
  product_id: undefined,
  status: 'available',
  date_from: undefined,
  date_to: undefined,
  search: '',
}

const DEFAULT_LIMIT = 50

// =============================================================================
// Hook
// =============================================================================

export function useInventoryOverview() {
  // State
  const [groupBy, setGroupBy] = useState<InventoryGroupBy>('product')
  const [filters, setFilters] = useState<InventoryFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const queryClient = useQueryClient()

  // Query key factory
  const queryKey = ['inventory-overview', groupBy, filters, page, DEFAULT_LIMIT]

  // Data fetching
  const { data, isLoading, error, refetch, isFetching } = useQuery<
    InventoryOverviewResponse<InventoryByProduct | InventoryByLocation | InventoryByWarehouse>
  >({
    queryKey,
    queryFn: () => fetchInventoryOverview(groupBy, filters, page, DEFAULT_LIMIT),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Handlers
  const handleGroupByChange = useCallback((newGroupBy: InventoryGroupBy) => {
    setGroupBy(newGroupBy)
    setPage(1) // Reset to first page when changing grouping
    setSortColumn(null) // Reset sort
  }, [])

  const handleFiltersChange = useCallback((newFilters: Partial<InventoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPage(1) // Reset to first page when changing filters
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }, [sortColumn])

  // Export handlers
  const handleExportCSV = useCallback(async () => {
    try {
      const blob = await exportInventoryCSV(groupBy, filters)
      const filename = `inventory-${groupBy}-${new Date().toISOString().split('T')[0]}.csv`
      downloadBlob(blob, filename)
    } catch (err) {
      console.error('CSV export failed:', err)
      throw err
    }
  }, [groupBy, filters])

  const handleExportExcel = useCallback(async () => {
    try {
      const blob = await exportInventoryExcel(groupBy, filters)
      const filename = `inventory-${groupBy}-${new Date().toISOString().split('T')[0]}.xlsx`
      downloadBlob(blob, filename)
    } catch (err) {
      console.error('Excel export failed:', err)
      throw err
    }
  }, [groupBy, filters])

  // Invalidate and refetch
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['inventory-overview'] })
  }, [queryClient])

  return {
    // State
    groupBy,
    filters,
    page,
    limit: DEFAULT_LIMIT,
    sortColumn,
    sortDirection,

    // Data
    data: data?.data || [],
    pagination: data?.pagination || { page: 1, limit: DEFAULT_LIMIT, total: 0, pages: 0 },
    summary: data?.summary || { total_lps: 0, total_qty: 0, total_value: 0 },

    // Query state
    isLoading,
    isFetching,
    error,

    // Actions
    setGroupBy: handleGroupByChange,
    setFilters: handleFiltersChange,
    clearFilters: handleClearFilters,
    setPage: handlePageChange,
    handleSort,
    refetch,
    invalidate,

    // Export
    exportCSV: handleExportCSV,
    exportExcel: handleExportExcel,
  }
}

export type UseInventoryOverviewReturn = ReturnType<typeof useInventoryOverview>
