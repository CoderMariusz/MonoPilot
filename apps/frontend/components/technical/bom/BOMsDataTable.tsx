/**
 * BOMsDataTable Component (Story 02.4)
 * Main BOM list table with all 4 UI states
 *
 * Features:
 * - Search with 300ms debounce
 * - Filter by status, product type, effective date
 * - Sortable columns
 * - Pagination
 * - Row click navigation
 * - Timeline button per row
 * - All 4 UI states (loading, error, empty, success)
 * - Keyboard navigation
 * - Responsive design
 *
 * Acceptance Criteria:
 * - AC-01 to AC-07: List page and display
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Calendar,
  Plus,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BOMStatusBadge } from './BOMStatusBadge'
import { BOMTimelineModal } from './BOMTimelineModal'
import { BOMCreateModal } from './BOMCreateModal'
import type { BOMWithProduct, BOMFilters, BOMStatus } from '@/lib/types/bom'

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

interface BOMsDataTableProps {
  boms: BOMWithProduct[]
  loading: boolean
  error: Error | null
  onRefresh: () => void
  filters: BOMFilters
  onFiltersChange: (filters: BOMFilters) => void
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  canCreate?: boolean
}

export function BOMsDataTable({
  boms,
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
}: BOMsDataTableProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [timelineModal, setTimelineModal] = useState<{
    open: boolean
    productId: string | null
    productCode?: string
    productName?: string
  }>({ open: false, productId: null })
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const debouncedSearch = useDebounce(searchInput, 300)

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch })
      onPaginationChange({ ...pagination, page: 1 })
    }
  }, [debouncedSearch])

  // Handle row click - navigate to detail page
  const handleRowClick = (bom: BOMWithProduct) => {
    router.push(`/technical/boms/${bom.id}`)
  }

  // Handle row keyboard navigation
  const handleRowKeyDown = (e: React.KeyboardEvent, bom: BOMWithProduct) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRowClick(bom)
    }
  }

  // Handle create click - open modal instead of navigating
  const handleCreateClick = () => {
    console.log('Create BOM clicked, opening modal...')
    setCreateModalOpen(true)
  }

  // Handle successful BOM creation
  const handleCreateSuccess = () => {
    onRefresh()
  }

  // Handle timeline button click
  const handleTimelineClick = (e: React.MouseEvent, bom: BOMWithProduct) => {
    e.stopPropagation()
    setTimelineModal({
      open: true,
      productId: bom.product_id,
      productCode: bom.product?.code,
      productName: bom.product?.name,
    })
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
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Ongoing'
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
          placeholder="Search by product code or name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
          aria-label="Search BOMs"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value === 'all' ? undefined : (value as BOMStatus),
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
          <SelectItem value="phased_out">Phased Out</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* Effective Date Filter */}
      <Select
        value={filters.effective_date || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            effective_date:
              value === 'all'
                ? undefined
                : (value as 'current' | 'future' | 'expired'),
          })
        }
      >
        <SelectTrigger className="w-[150px]" aria-label="Filter by date range">
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Dates</SelectItem>
          <SelectItem value="current">Current</SelectItem>
          <SelectItem value="future">Future</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      {/* Create Button */}
      {canCreate && (
        <Button type="button" onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Create BOM
        </Button>
      )}
    </div>
  )

  // Loading State
  if (loading) {
    return (
      <>
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
                <span>Loading BOMs...</span>
              </div>
              <div className="mt-4 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Create BOM Modal */}
        <BOMCreateModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={handleCreateSuccess}
        />
      </>
    )
  }

  // Error State
  if (error) {
    return (
      <>
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
                  Failed to Load BOMs
                </h2>
                <p className="mt-2 text-slate-600">
                  Unable to retrieve BOM list. Please check your connection.
                </p>
                <p className="mt-2 font-mono text-sm text-red-600">
                  Error: {error.message}
                </p>
              </div>
              <Button onClick={onRefresh} aria-label="Retry loading BOMs">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>

        {/* Create BOM Modal */}
        <BOMCreateModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={handleCreateSuccess}
        />
      </>
    )
  }

  // Empty State
  if (boms.length === 0) {
    return (
      <>
        <div className="space-y-4">
          <FiltersSection />
          <div className="rounded-md border bg-slate-50 p-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <FileText className="w-24 h-24 text-slate-300" aria-hidden="true" />
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {filters.search || filters.status || filters.effective_date
                    ? 'No BOMs Match Your Filters'
                    : 'No BOMs Found'}
                </h2>
                <p className="mt-2 max-w-md text-slate-600">
                  {filters.search || filters.status || filters.effective_date
                    ? 'Try adjusting your search or filters to find BOMs.'
                    : 'Bills of Materials define the ingredients and components needed to produce your products.'}
                </p>
              </div>
              {canCreate && !filters.search && !filters.status && !filters.effective_date && (
                <Button
                  type="button"
                  onClick={handleCreateClick}
                  size="lg"
                  className="mt-2"
                  aria-label="Create your first BOM"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First BOM
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Create BOM Modal */}
        <BOMCreateModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={handleCreateSuccess}
        />
      </>
    )
  }

  // Success State - Table with data
  return (
    <div className="space-y-4">
      <FiltersSection />

      {/* Table */}
      <div className="rounded-md border">
        <Table aria-label="Bills of Materials table">
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleHeaderClick('product_code')}
                aria-sort={getAriaSort('product_code')}
              >
                Product Code
                {getSortIcon('product_code')}
              </TableHead>
              <TableHead>Product Name</TableHead>
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
                onClick={() => handleHeaderClick('effective_from')}
                aria-sort={getAriaSort('effective_from')}
              >
                Effective From
                {getSortIcon('effective_from')}
              </TableHead>
              <TableHead>Effective To</TableHead>
              <TableHead>Output</TableHead>
              <TableHead className="w-[100px]">Timeline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boms.map((bom) => (
              <TableRow
                key={bom.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleRowClick(bom)}
                onKeyDown={(e) => handleRowKeyDown(e, bom)}
                tabIndex={0}
                aria-label={`BOM: ${bom.product?.code} v${bom.version}, Status: ${bom.status}`}
              >
                <TableCell className="font-mono font-medium">
                  {bom.product?.code || 'N/A'}
                </TableCell>
                <TableCell>{bom.product?.name || 'Unknown Product'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    v{bom.version}
                  </Badge>
                </TableCell>
                <TableCell>
                  <BOMStatusBadge status={bom.status} size="sm" />
                </TableCell>
                <TableCell>{formatDate(bom.effective_from)}</TableCell>
                <TableCell>{formatDate(bom.effective_to)}</TableCell>
                <TableCell>
                  {bom.output_qty} {bom.output_uom}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleTimelineClick(e, bom)}
                    aria-label={`View timeline for ${bom.product?.code}`}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
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
            {pagination.total} BOMs
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

      {/* Timeline Modal */}
      <BOMTimelineModal
        open={timelineModal.open}
        onOpenChange={(open) => setTimelineModal({ ...timelineModal, open })}
        productId={timelineModal.productId}
        productCode={timelineModal.productCode}
        productName={timelineModal.productName}
      />

      {/* Create BOM Modal */}
      <BOMCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

export default BOMsDataTable
