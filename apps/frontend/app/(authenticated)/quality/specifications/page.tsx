/**
 * Quality Specifications List Page
 * Story: 06.3 - Product Specifications
 *
 * Route: /quality/specifications
 *
 * Features:
 * - Paginated specifications list with all 4 states
 * - Search, filter by status
 * - Sortable columns
 * - Row click navigation to detail
 * - Create new specification button
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SpecificationsDataTable } from '@/components/quality/specifications'
import { useSpecifications } from '@/lib/hooks/use-specifications'
import type { SpecificationListParams, SpecificationStatus } from '@/lib/types/quality'

interface PaginationState {
  page: number
  limit: number
  total: number
}

interface SortingState {
  field: string
  order: 'asc' | 'desc'
}

export default function SpecificationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize filters from URL params
  const [filters, setFilters] = useState<SpecificationListParams>(() => ({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as SpecificationStatus) || undefined,
    product_id: searchParams.get('product_id') || undefined,
  }))

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '20', 10),
    total: 0,
  })

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>({
    field: searchParams.get('sort_by') || 'created_at',
    order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
  })

  // Build query params for React Query
  const queryFilters: SpecificationListParams = {
    ...filters,
    page: pagination.page,
    limit: pagination.limit,
    sort_by: sorting.field,
    sort_order: sorting.order,
  }

  // Fetch specifications with React Query
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useSpecifications(queryFilters)

  // Update pagination total when data changes
  useEffect(() => {
    if (data?.pagination?.total !== undefined && data.pagination.total !== pagination.total) {
      setPagination((prev) => ({ ...prev, total: data.pagination.total }))
    }
  }, [data?.pagination?.total])

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams()

    if (filters.search) params.set('search', filters.search)
    if (filters.status) params.set('status', filters.status)
    if (filters.product_id) params.set('product_id', filters.product_id)
    if (pagination.page > 1) params.set('page', pagination.page.toString())
    if (pagination.limit !== 20) params.set('limit', pagination.limit.toString())
    if (sorting.field !== 'created_at') params.set('sort_by', sorting.field)
    if (sorting.order !== 'desc') params.set('sort_order', sorting.order)

    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : '/quality/specifications'

    router.replace(newUrl, { scroll: false })
  }, [filters, pagination.page, pagination.limit, sorting, router])

  // Handlers
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleFiltersChange = useCallback((newFilters: SpecificationListParams) => {
    setFilters(newFilters)
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handlePaginationChange = useCallback((newPagination: PaginationState) => {
    setPagination(newPagination)
  }, [])

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting)
  }, [])

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Quality Specifications</h1>
        <p className="text-slate-600 mt-1">
          Manage versioned product quality specifications with approval workflow.
          Define test parameters and acceptance criteria for your products.
        </p>
      </div>

      {/* Data Table with all 4 states */}
      <SpecificationsDataTable
        specifications={data?.specifications || []}
        loading={isLoading}
        error={error as Error | null}
        onRefresh={handleRefresh}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        canCreate={true}
      />
    </div>
  )
}
