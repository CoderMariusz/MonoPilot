/**
 * BOM List Page (Story 02.4 - TEC-005)
 * Bill of Materials catalog management with CRUD operations
 *
 * Features:
 * - BOMsDataTable with all 4 UI states
 * - Search, filter, sort, pagination
 * - Timeline modal for version visualization
 * - Create/Edit/Delete operations
 * - Responsive design
 * - WCAG 2.1 AA compliant
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TechnicalHeader } from '@/components/technical/TechnicalHeader'
import { BOMsDataTable } from '@/components/technical/bom/BOMsDataTable'
import { useBOMs } from '@/lib/hooks/use-boms'
import type { BOMFilters } from '@/lib/types/bom'

interface PaginationState {
  page: number
  limit: number
  total: number
}

interface SortingState {
  field: string
  order: 'asc' | 'desc'
}

export default function BOMsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize filters from URL params
  const [filters, setFilters] = useState<BOMFilters>(() => ({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as BOMFilters['status']) || undefined,
    effective_date: (searchParams.get('effective_date') as BOMFilters['effective_date']) || undefined,
    product_type: searchParams.get('product_type') || undefined,
  }))

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '20', 10),
    total: 0,
  })

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>({
    field: searchParams.get('sortBy') || 'effective_from',
    order: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  })

  // Build query params for React Query
  const queryFilters: BOMFilters = {
    ...filters,
    page: pagination.page,
    limit: pagination.limit,
    sortBy: sorting.field,
    sortOrder: sorting.order,
  }

  // Fetch BOMs with React Query
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useBOMs(queryFilters)

  // Update pagination total when data changes
  useEffect(() => {
    if (data?.total !== undefined && data.total !== pagination.total) {
      setPagination((prev) => ({ ...prev, total: data.total }))
    }
  }, [data?.total])

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams()

    if (filters.search) params.set('search', filters.search)
    if (filters.status) params.set('status', filters.status)
    if (filters.effective_date) params.set('effective_date', filters.effective_date)
    if (filters.product_type) params.set('product_type', filters.product_type)
    if (pagination.page > 1) params.set('page', pagination.page.toString())
    if (pagination.limit !== 20) params.set('limit', pagination.limit.toString())
    if (sorting.field !== 'effective_from') params.set('sortBy', sorting.field)
    if (sorting.order !== 'desc') params.set('sortOrder', sorting.order)

    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : '/technical/boms'

    router.replace(newUrl, { scroll: false })
  }, [filters, pagination.page, pagination.limit, sorting, router])

  // Handlers
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleFiltersChange = useCallback((newFilters: BOMFilters) => {
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
    <div>
      <TechnicalHeader currentPage="boms" />

      <div className="container mx-auto py-6 px-4">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Bills of Materials</h1>
          <p className="text-slate-600 mt-1">
            Manage recipes and component lists for your products. Each BOM defines
            the ingredients, quantities, and output for production.
          </p>
        </div>

        {/* Data Table with all 4 states */}
        <BOMsDataTable
          boms={data?.boms || []}
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
    </div>
  )
}
