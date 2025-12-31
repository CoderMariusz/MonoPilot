/**
 * Work Orders List Page
 * Story 03.10: Work Order CRUD - List Page (PLAN-013)
 *
 * Features:
 * - KPI Cards (Scheduled Today, In Progress, On Hold, This Week)
 * - Search and Filters (status, product, line, priority, date range)
 * - DataTable with sorting, row selection
 * - All 4 states: Loading, Empty, Error, Success
 * - Responsive design
 * - WCAG 2.1 AA compliant
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, LayoutGrid, CalendarDays, TableIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useToast } from '@/hooks/use-toast'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import { useWorkOrders } from '@/lib/hooks/use-work-orders'
import {
  useDeleteWorkOrder,
  usePlanWorkOrder,
  useReleaseWorkOrder,
  useCancelWorkOrder,
} from '@/lib/hooks/use-work-order-mutations'
import type { WOListItem, WOListParams } from '@/lib/types/work-order'
import {
  WOKPICards,
  WOFilters,
  WODataTable,
  WOForm,
  WODeleteConfirmDialog,
  WOCancelConfirmDialog,
  WOEmptyState,
  WOErrorState,
  type WOFiltersState,
} from '@/components/planning/work-orders'

type ViewMode = 'table' | 'gantt'

export default function WorkOrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  // Filter state
  const [filters, setFilters] = useState<WOFiltersState>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status')?.split(',').filter(Boolean) || [],
    product_id: searchParams.get('product') || null,
    line_id: searchParams.get('line') || null,
    priority: null,
    date_from: searchParams.get('date_from') || null,
    date_to: searchParams.get('date_to') || null,
  })

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  // Sorting state
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal states
  const [formOpen, setFormOpen] = useState(false)
  const [editingWO, setEditingWO] = useState<WOListItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingWO, setDeletingWO] = useState<WOListItem | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancellingWO, setCancellingWO] = useState<WOListItem | null>(null)

  // Reference data
  const [products, setProducts] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [productionLines, setProductionLines] = useState<Array<{ id: string; code: string; name: string }>>([])

  // Build query params
  const queryParams: WOListParams = {
    page,
    limit,
    search: filters.search || undefined,
    status: filters.status.length > 0 ? filters.status.join(',') : undefined,
    product_id: filters.product_id || undefined,
    line_id: filters.line_id || undefined,
    priority: filters.priority || undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
    sort: sortField as any,
    order: sortOrder,
  }

  // Data fetching
  const { data, isLoading, error, refetch } = useWorkOrders(queryParams)

  // Mutations
  const deleteMutation = useDeleteWorkOrder()
  const planMutation = usePlanWorkOrder()
  const releaseMutation = useReleaseWorkOrder()
  const cancelMutation = useCancelWorkOrder()

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [productsRes, linesRes] = await Promise.all([
          fetch('/api/technical/products?type=FG&limit=500'),
          fetch('/api/settings/production-lines?is_active=true&limit=500'),
        ])

        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data.data || [])
        }

        if (linesRes.ok) {
          const data = await linesRes.json()
          setProductionLines(data.production_lines || data.data || [])
        }
      } catch (error) {
        console.error('Error fetching reference data:', error)
      }
    }

    fetchReferenceData()
  }, [])

  // Handlers
  const handleFiltersChange = useCallback((newFilters: WOFiltersState) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page on filter change
    setSelectedIds([]) // Clear selection
  }, [])

  const handleKPICardClick = useCallback((filter: {
    status?: string
    dateFilter?: 'today' | 'this_week'
  }) => {
    const newFilters = { ...filters }

    if (filter.status) {
      newFilters.status = [filter.status]
    }

    if (filter.dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      newFilters.date_from = today
      newFilters.date_to = today
    } else if (filter.dateFilter === 'this_week') {
      const today = new Date()
      const monday = new Date(today)
      monday.setDate(today.getDate() - today.getDay() + 1)
      newFilters.date_from = monday.toISOString().split('T')[0]
      newFilters.date_to = today.toISOString().split('T')[0]
    }

    handleFiltersChange(newFilters)
  }, [filters, handleFiltersChange])

  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortField(field)
    setSortOrder(order)
  }, [])

  const handleRowClick = useCallback((wo: WOListItem) => {
    router.push(`/planning/work-orders/${wo.id}`)
  }, [router])

  const handleEdit = useCallback((wo: WOListItem) => {
    setEditingWO(wo)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((wo: WOListItem) => {
    setDeletingWO(wo)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingWO) return

    try {
      await deleteMutation.mutateAsync(deletingWO.id)
      toast({
        title: 'Success',
        description: `Work order ${deletingWO.wo_number} deleted successfully`,
      })
      setDeleteDialogOpen(false)
      setDeletingWO(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete work order',
        variant: 'destructive',
      })
    }
  }, [deletingWO, deleteMutation, toast])

  const handlePlan = useCallback(async (wo: WOListItem) => {
    try {
      await planMutation.mutateAsync({ id: wo.id })
      toast({
        title: 'Success',
        description: `Work order ${wo.wo_number} planned successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to plan work order',
        variant: 'destructive',
      })
    }
  }, [planMutation, toast])

  const handleRelease = useCallback(async (wo: WOListItem) => {
    try {
      await releaseMutation.mutateAsync({ id: wo.id })
      toast({
        title: 'Success',
        description: `Work order ${wo.wo_number} released successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to release work order',
        variant: 'destructive',
      })
    }
  }, [releaseMutation, toast])

  const handleCancel = useCallback((wo: WOListItem) => {
    setCancellingWO(wo)
    setCancelDialogOpen(true)
  }, [])

  const handleConfirmCancel = useCallback(async (reason?: string) => {
    if (!cancellingWO) return

    try {
      await cancelMutation.mutateAsync({ id: cancellingWO.id, reason })
      toast({
        title: 'Success',
        description: `Work order ${cancellingWO.wo_number} cancelled`,
      })
      setCancelDialogOpen(false)
      setCancellingWO(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel work order',
        variant: 'destructive',
      })
    }
  }, [cancellingWO, cancelMutation, toast])

  const handleFormSuccess = useCallback(() => {
    setFormOpen(false)
    setEditingWO(null)
    refetch()
  }, [refetch])

  // Render
  const hasActiveFilters = filters.search || filters.status.length > 0 ||
    filters.product_id || filters.line_id || filters.priority ||
    filters.date_from || filters.date_to

  const isEmpty = !isLoading && !error && (!data?.data || data.data.length === 0)
  const isFilteredEmpty = isEmpty && hasActiveFilters

  return (
    <div className="min-h-screen bg-gray-50">
      <PlanningHeader currentPage="wo" />

      <div className="px-4 md:px-6 py-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
            <p className="text-gray-500 text-sm">
              Manage production work orders and scheduling
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-white shadow-sm' : ''}
              >
                <TableIcon className="h-4 w-4 mr-1" />
                Table
              </Button>
              <Button
                variant={viewMode === 'gantt' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('gantt')}
                className={viewMode === 'gantt' ? 'bg-white shadow-sm' : ''}
                disabled
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Gantt
              </Button>
            </div>

            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create WO
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <WOKPICards onCardClick={handleKPICardClick} />

        {/* Filters */}
        <WOFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          products={products}
          productionLines={productionLines}
          isLoading={isLoading}
        />

        {/* Content */}
        {error ? (
          <WOErrorState
            message={error.message}
            onRetry={() => refetch()}
          />
        ) : isEmpty ? (
          <WOEmptyState
            type={isFilteredEmpty ? 'filtered_empty' : 'no_data'}
            onCreateClick={() => setFormOpen(true)}
            onClearFilters={() => handleFiltersChange({
              search: '',
              status: [],
              product_id: null,
              line_id: null,
              priority: null,
              date_from: null,
              date_to: null,
            })}
            activeFilters={[
              ...(filters.search ? [`Search: "${filters.search}"`] : []),
              ...filters.status,
            ]}
          />
        ) : (
          <>
            {/* Bulk Actions (placeholder for selected items) */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-800">
                  {selectedIds.length} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds([])}
                >
                  Clear Selection
                </Button>
              </div>
            )}

            {/* Data Table */}
            <WODataTable
              data={data?.data || []}
              loading={isLoading}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPlan={handlePlan}
              onRelease={handleRelease}
              onCancel={handleCancel}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, data.pagination.total)} of {data.pagination.total} work orders
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-disabled={page === 1}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                        aria-disabled={page === data.pagination.totalPages}
                        className={page === data.pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <WOForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingWO(null)
        }}
        workOrder={editingWO ? { ...editingWO, org_id: '', uom: editingWO.uom } as any : undefined}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <WODeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        woNumber={deletingWO?.wo_number || ''}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />

      {/* Cancel Confirmation */}
      <WOCancelConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        woNumber={cancellingWO?.wo_number || ''}
        onConfirm={handleConfirmCancel}
        isCancelling={cancelMutation.isPending}
      />
    </div>
  )
}
