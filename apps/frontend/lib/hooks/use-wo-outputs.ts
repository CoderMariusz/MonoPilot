/**
 * React Query Hook: useWOOutputs
 * Story 04.7d: Multiple Outputs per WO - Output List Management
 *
 * Fetches paginated outputs for a work order with filtering:
 * - Pagination (page, limit)
 * - QA status filter
 * - Location filter
 * - Sort options
 */

import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import type {
  OutputsListResponse,
  OutputQueryOptions,
  OutputItem,
  OutputsSummary,
  Pagination,
} from '@/lib/services/output-aggregation-service'

/**
 * Query key factory for WO outputs
 */
export const woOutputsKeys = {
  all: ['wo-outputs'] as const,
  list: (woId: string, options?: OutputQueryOptions) =>
    [...woOutputsKeys.all, woId, options] as const,
}

/**
 * Fetch outputs from API
 */
async function fetchWOOutputs(
  woId: string,
  options: OutputQueryOptions = {}
): Promise<OutputsListResponse> {
  const params = new URLSearchParams()

  if (options.page) params.set('page', String(options.page))
  if (options.limit) params.set('limit', String(options.limit))
  if (options.qa_status) params.set('qa_status', options.qa_status)
  if (options.location_id) params.set('location_id', options.location_id)
  if (options.sort) params.set('sort', options.sort)
  if (options.order) params.set('order', options.order)

  const url = `/api/production/work-orders/${woId}/outputs?${params.toString()}`
  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Work order not found')
    }
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch outputs')
  }

  const data = await response.json()
  return data.data
}

/**
 * Hook to fetch and manage WO outputs with pagination and filtering
 *
 * @param woId - Work order ID
 * @param initialOptions - Initial query options
 * @returns Outputs data, pagination, filters, and control functions
 */
export function useWOOutputs(
  woId: string | null | undefined,
  initialOptions: OutputQueryOptions = {}
) {
  const [options, setOptions] = useState<OutputQueryOptions>({
    page: 1,
    limit: 20,
    sort: 'created_at',
    order: 'desc',
    ...initialOptions,
  })

  const query = useQuery({
    queryKey: woOutputsKeys.list(woId || '', options),
    queryFn: () => fetchWOOutputs(woId!, options),
    enabled: !!woId,
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: true,
  })

  // Filter setters
  const setFilters = useCallback((newFilters: Partial<OutputQueryOptions>) => {
    setOptions((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page on filter change
    }))
  }, [])

  const setPage = useCallback((page: number) => {
    setOptions((prev) => ({ ...prev, page }))
  }, [])

  // Empty defaults for initial state
  const emptyOutputs: OutputItem[] = []
  const emptySummary: OutputsSummary = {
    total_outputs: 0,
    total_qty: 0,
    approved_count: 0,
    approved_qty: 0,
    pending_count: 0,
    pending_qty: 0,
    rejected_count: 0,
    rejected_qty: 0,
  }
  const emptyPagination: Pagination = {
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  }

  return {
    outputs: query.data?.outputs || emptyOutputs,
    summary: query.data?.summary || emptySummary,
    pagination: query.data?.pagination || emptyPagination,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
    setFilters,
    setPage,
    currentFilters: options,
  }
}

export default useWOOutputs
