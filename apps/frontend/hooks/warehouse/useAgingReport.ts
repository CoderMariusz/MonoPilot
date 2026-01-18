/**
 * useAgingReport Hook
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * React hook for managing aging report state and data fetching.
 * Supports FIFO (receipt date) and FEFO (expiry date) aging modes.
 */

'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchAgingReport,
  fetchTopOldestStock,
  exportAgingReportCSV,
  downloadBlob,
  type AgingFilters,
} from '@/lib/api/aging-report-api'

/**
 * Hook for managing aging report state and data
 */
export function useAgingReport() {
  // State
  const [mode, setMode] = useState<'fifo' | 'fefo'>('fifo')
  const [filters, setFilters] = useState<AgingFilters>({
    warehouse_id: undefined,
    product_category_id: undefined,
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [isExporting, setIsExporting] = useState(false)

  // Fetch aging report data
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['aging-report', mode, filters, page, limit],
    queryFn: () => fetchAgingReport(mode, filters, limit),
    staleTime: 60 * 1000, // 60 seconds cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  })

  // Fetch top oldest stock items
  const {
    data: topOldest,
    isLoading: isLoadingTopOldest,
    error: topOldestError,
  } = useQuery({
    queryKey: ['top-oldest', mode],
    queryFn: () => fetchTopOldestStock(mode, 10),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Mode change handler
  const handleModeChange = useCallback((newMode: 'fifo' | 'fefo') => {
    setMode(newMode)
    setPage(1) // Reset page when mode changes
  }, [])

  // Filters change handler
  const handleFiltersChange = useCallback((newFilters: AgingFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset page when filters change
  }, [])

  // Clear filters handler
  const clearFilters = useCallback(() => {
    setFilters({
      warehouse_id: undefined,
      product_category_id: undefined,
    })
    setPage(1)
  }, [])

  // Export handler
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const blob = await exportAgingReportCSV(mode, filters)
      const timestamp = new Date().toISOString().split('T')[0]
      downloadBlob(blob, `aging-report-${mode}-${timestamp}.csv`)
    } catch (err) {
      console.error('Export failed:', err)
      throw err
    } finally {
      setIsExporting(false)
    }
  }, [mode, filters])

  return {
    // Mode
    mode,
    setMode: handleModeChange,

    // Filters
    filters,
    setFilters: handleFiltersChange,
    clearFilters,

    // Pagination
    page,
    setPage,
    limit,

    // Data
    data,
    topOldest,

    // Loading states
    isLoading,
    isLoadingTopOldest,
    isExporting,

    // Errors
    error: error as Error | null,
    topOldestError: topOldestError as Error | null,

    // Actions
    refetch,
    handleExport,
  }
}

export type UseAgingReportReturn = ReturnType<typeof useAgingReport>
