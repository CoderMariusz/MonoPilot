'use client'

/**
 * SpecificationsDataTable Component
 * Story: 06.3 - Product Specifications
 *
 * Main specifications list table with all 4 UI states.
 *
 * Features:
 * - Search with 300ms debounce
 * - Filter by status, product
 * - Sortable columns
 * - Pagination
 * - Row click navigation
 * - All 4 UI states (loading, error, empty, success)
 * - Keyboard navigation
 * - Responsive design
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  RefreshCw,
  Search,
  ArrowUp,
  ArrowDown,
  Plus,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SpecificationStatusBadge } from './SpecificationStatusBadge'
import { ReviewStatusBadge } from './ReviewStatusBadge'
import type {
  QualitySpecification,
  SpecificationStatus,
  SpecificationListParams,
} from '@/lib/types/quality'

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

interface PaginationState {
  page: number
  limit: number
  total: number
}

interface SortingState {
  field: string
  order: 'asc' | 'desc'
}

interface SpecificationsDataTableProps {
  specifications: QualitySpecification[]
  loading: boolean
  error: Error | null
  onRefresh: () => void
  filters: SpecificationListParams
  onFiltersChange: (filters: SpecificationListParams) => void
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  canCreate?: boolean
}

export function SpecificationsDataTable({
  specifications,
  loading,
  error,
  onRefresh,
  filters,
  onFiltersChange,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  canCreate = true,
}: SpecificationsDataTableProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(filters.search || '')

  const debouncedSearch = useDebounce(searchInput, 300)

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch })
      onPaginationChange({ ...pagination, page: 1 })
    }
  }, [debouncedSearch])

  // Handle row click - navigate to detail page
  const handleRowClick = (spec: QualitySpecification) => {
    router.push(`/quality/specifications/${spec.id}`)
  }

  // Handle row keyboard navigation
  const handleRowKeyDown = (e: React.KeyboardEvent, spec: QualitySpecification) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRowClick(spec)
    }
  }

  // Handle create click
  const handleCreateClick = () => {
    router.push('/quality/specifications/new')
  }

  // Handle sorting
  const handleHeaderClick = (field: string) => {
    if (sorting.field === field) {
      onSortingChange({
        field,
        order: sorting.order === 'asc' ? 'desc' : 'asc',
      })
    } else {
      onSortingChange({ field, order: 'asc' })
    }
  }

  const getSortIcon = (field: string) => {
    if (sorting.field !== field) return null
    return sorting.order === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1 inline" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 inline" />
    )
  }

  const getAriaSort = (field: string): 'ascending' | 'descending' | 'none' => {
    if (sorting.field !== field) return 'none'
    return sorting.order === 'asc' ? 'ascending' : 'descending'
  }

  // Format date for display
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  // Filters component
  const FiltersSection = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by spec number, name, or product..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
          aria-label="Search specifications"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value === 'all' ? undefined : (value as SpecificationStatus),
          })
        }
      >
        <SelectTrigger className="w-[150px]" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
          <SelectItem value="superseded">Superseded</SelectItem>
        </SelectContent>
      </Select>

      {/* Create Button */}
      {canCreate && (
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          New Specification
        </Button>
      )}
    </div>
  )

  // Loading State
  if (loading) {
    return (
      <div className="space-y-4">
        <FiltersSection />
        <div
          role="status"
          aria-busy="true"
          aria-live="polite"
          className="rounded-md border"
        >
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading specifications...</span>
            </div>
            <div className="mt-4 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-4">
        <FiltersSection />
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-red-200 bg-red-50 p-8"
        >
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Failed to Load Specifications
              </h2>
              <p className="mt-2 text-slate-600">
                Unable to retrieve specification list. Please check your connection.
              </p>
              <p className="mt-2 font-mono text-sm text-red-600">
                Error: {error.message}
              </p>
            </div>
            <Button onClick={onRefresh} aria-label="Retry loading specifications">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Empty State
  if (specifications.length === 0) {
    return (
      <div className="space-y-4">
        <FiltersSection />
        <div className="rounded-md border bg-slate-50 p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <FileText className="w-24 h-24 text-slate-300" aria-hidden="true" />
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {filters.search || filters.status
                  ? 'No Specifications Match Your Filters'
                  : 'No Specifications Found'}
              </h2>
              <p className="mt-2 max-w-md text-slate-600">
                {filters.search || filters.status
                  ? 'Try adjusting your search or filters to find specifications.'
                  : 'Quality specifications define the test parameters and acceptance criteria for your products.'}
              </p>
            </div>
            {canCreate && !filters.search && !filters.status && (
              <Button
                onClick={handleCreateClick}
                size="lg"
                className="mt-2"
                aria-label="Create your first specification"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Specification
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Success State - Table with data
  return (
    <div className="space-y-4">
      <FiltersSection />

      {/* Table */}
      <div className="rounded-md border">
        <Table aria-label="Quality Specifications table">
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleHeaderClick('spec_number')}
                aria-sort={getAriaSort('spec_number')}
              >
                Spec Number
                {getSortIcon('spec_number')}
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Product</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleHeaderClick('version')}
                aria-sort={getAriaSort('version')}
              >
                Version
                {getSortIcon('version')}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleHeaderClick('effective_date')}
                aria-sort={getAriaSort('effective_date')}
              >
                Effective Date
                {getSortIcon('effective_date')}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleHeaderClick('next_review_date')}
                aria-sort={getAriaSort('next_review_date')}
              >
                Review Due
                {getSortIcon('next_review_date')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specifications.map((spec) => (
              <TableRow
                key={spec.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleRowClick(spec)}
                onKeyDown={(e) => handleRowKeyDown(e, spec)}
                tabIndex={0}
                aria-label={`Specification: ${spec.spec_number} v${spec.version}, Status: ${spec.status}`}
              >
                <TableCell className="font-mono font-medium">
                  {spec.spec_number}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {spec.name}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="font-mono">{spec.product_code || 'N/A'}</span>
                    {spec.product_name && (
                      <span className="text-muted-foreground ml-2">
                        {spec.product_name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    v{spec.version}
                  </Badge>
                </TableCell>
                <TableCell>
                  <SpecificationStatusBadge status={spec.status} size="sm" />
                </TableCell>
                <TableCell>{formatDate(spec.effective_date)}</TableCell>
                <TableCell>
                  {spec.status === 'active' && spec.next_review_date ? (
                    <ReviewStatusBadge
                      status={spec.review_status}
                      daysUntilReview={spec.days_until_review}
                      size="sm"
                    />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between"
          aria-label="Pagination navigation"
        >
          <div className="text-sm text-slate-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} specifications
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPaginationChange({
                  ...pagination,
                  page: pagination.page - 1,
                })
              }
              disabled={pagination.page === 1}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPaginationChange({
                  ...pagination,
                  page: pagination.page + 1,
                })
              }
              disabled={pagination.page === totalPages}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpecificationsDataTable
