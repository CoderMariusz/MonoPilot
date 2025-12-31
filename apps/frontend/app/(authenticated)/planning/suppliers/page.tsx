/**
 * Suppliers List Page
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * List page with KPIs, filters, search, bulk actions, pagination
 */

'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Building2, FilterX, WifiOff, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import {
  SupplierListKPIs,
  SupplierListTable,
  SupplierFilters,
  SupplierBulkActions,
  SupplierCreateEditModal,
  SupplierDeleteModal,
} from '@/components/planning/suppliers'
import {
  useSuppliers,
  useSupplierSummary,
  useBulkDeactivateSuppliers,
  useBulkActivateSuppliers,
  useDeleteSupplier,
  useDeactivateSupplier,
  useActivateSupplier,
  useExportSuppliers,
} from '@/lib/hooks/use-suppliers'
import type { Supplier, SupplierFilters as SupplierFiltersType, SupplierStatusFilter } from '@/lib/types/supplier'

const DEFAULT_FILTERS: SupplierFiltersType = {
  status: 'all',
  currency: [],
  payment_terms: null,
  search: '',
}

export default function SuppliersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State
  const [filters, setFilters] = useState<SupplierFiltersType>(() => ({
    status: (searchParams.get('status') as SupplierStatusFilter) || 'all',
    currency: searchParams.getAll('currency'),
    payment_terms: searchParams.get('payment_terms'),
    search: searchParams.get('search') || '',
  }))
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('code')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isMobile, setIsMobile] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  // Hooks
  const {
    data: suppliersData,
    isLoading: loadingSuppliers,
    error: suppliersError,
    refetch: refetchSuppliers,
  } = useSuppliers({
    ...filters,
    page,
    limit: isMobile ? 10 : 20,
    sort: sortColumn,
    order: sortOrder,
  })

  const { data: summary, isLoading: loadingSummary } = useSupplierSummary()
  const bulkDeactivate = useBulkDeactivateSuppliers()
  const bulkActivate = useBulkActivateSuppliers()
  const deleteSupplier = useDeleteSupplier()
  const deactivateSupplier = useDeactivateSupplier()
  const activateSupplier = useActivateSupplier()
  const exportSuppliers = useExportSuppliers()

  const suppliers = useMemo(() => suppliersData?.data || [], [suppliersData?.data])
  const pagination = suppliersData?.meta

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync URL with filters
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.status !== 'all') params.set('status', filters.status)
    if (filters.search) params.set('search', filters.search)
    if (filters.payment_terms) params.set('payment_terms', filters.payment_terms)
    filters.currency.forEach((c) => params.append('currency', c))
    if (page > 1) params.set('page', page.toString())

    const newUrl = params.toString() ? `?${params.toString()}` : '/planning/suppliers'
    router.replace(newUrl, { scroll: false })
  }, [filters, page, router])

  // Selection handlers
  const selectedSuppliers = useMemo(
    () => suppliers.filter((s) => selectedIds.includes(s.id)),
    [suppliers, selectedIds]
  )

  const allSelected = suppliers.length > 0 && selectedIds.length === suppliers.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < suppliers.length

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(suppliers.map((s) => s.id))
    }
  }, [allSelected, suppliers])

  // Filter handlers
  const handleFilterChange = useCallback((newFilters: SupplierFiltersType) => {
    setFilters(newFilters)
    setPage(1)
    setSelectedIds([])
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
    setSelectedIds([])
  }, [])

  const handleKPIFilterChange = useCallback((status: SupplierStatusFilter) => {
    setFilters((prev) => ({ ...prev, status }))
    setPage(1)
    setSelectedIds([])
  }, [])

  // Sort handler
  const handleSort = useCallback((column: string) => {
    setSortColumn(column)
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    setPage(1)
  }, [])

  // CRUD handlers
  const handleViewDetails = useCallback(
    (supplier: Supplier) => {
      router.push(`/planning/suppliers/${supplier.id}`)
    },
    [router]
  )

  const handleEdit = useCallback((supplier: Supplier) => {
    setEditingSupplier(supplier)
    setCreateModalOpen(true)
  }, [])

  const handleDeactivate = useCallback(
    async (supplier: Supplier) => {
      try {
        await deactivateSupplier.mutateAsync({ id: supplier.id })
        toast({
          title: 'Success',
          description: `Supplier ${supplier.code} deactivated successfully`,
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to deactivate supplier',
          variant: 'destructive',
        })
      }
    },
    [deactivateSupplier, toast]
  )

  const handleActivate = useCallback(
    async (supplier: Supplier) => {
      try {
        await activateSupplier.mutateAsync(supplier.id)
        toast({
          title: 'Success',
          description: `Supplier ${supplier.code} activated successfully`,
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to activate supplier',
          variant: 'destructive',
        })
      }
    },
    [activateSupplier, toast]
  )

  const handleDelete = useCallback((supplier: Supplier) => {
    setDeleteError(null)
    setDeletingSupplier(supplier)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deletingSupplier) return

    try {
      await deleteSupplier.mutateAsync(deletingSupplier.id)
      toast({
        title: 'Success',
        description: `Supplier ${deletingSupplier.code} deleted successfully`,
      })
      setDeletingSupplier(null)
      setSelectedIds((prev) => prev.filter((id) => id !== deletingSupplier.id))
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Failed to delete supplier'
      )
    }
  }, [deletingSupplier, deleteSupplier, toast])

  // Bulk actions
  const handleBulkDeactivate = useCallback(async () => {
    const activeIds = selectedSuppliers.filter((s) => s.is_active).map((s) => s.id)
    if (activeIds.length === 0) return

    const result = await bulkDeactivate.mutateAsync({ ids: activeIds })

    if (result.success_count > 0) {
      toast({
        title: 'Success',
        description: `${result.success_count} supplier(s) deactivated successfully`,
      })
    }

    if (result.failed_count > 0) {
      toast({
        title: 'Partial Success',
        description: `${result.failed_count} supplier(s) could not be deactivated`,
        variant: 'destructive',
      })
    }

    setSelectedIds([])
    return result
  }, [selectedSuppliers, bulkDeactivate, toast])

  const handleBulkActivate = useCallback(async () => {
    const inactiveIds = selectedSuppliers.filter((s) => !s.is_active).map((s) => s.id)
    if (inactiveIds.length === 0) return

    const result = await bulkActivate.mutateAsync(inactiveIds)

    toast({
      title: 'Success',
      description: `${result.success_count} supplier(s) activated successfully`,
    })

    setSelectedIds([])
    return result
  }, [selectedSuppliers, bulkActivate, toast])

  const handleExport = useCallback(async () => {
    if (selectedIds.length === 0) return

    try {
      const blob = await exportSuppliers.mutateAsync({ supplierIds: selectedIds })

      // Download file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `suppliers_export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: `${selectedIds.length} supplier(s) exported successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export suppliers',
        variant: 'destructive',
      })
    }
  }, [selectedIds, exportSuppliers, toast])

  const handleCreateSuccess = useCallback(
    (supplier: Supplier) => {
      setCreateModalOpen(false)
      setEditingSupplier(null)
      toast({
        title: 'Success',
        description: `Supplier ${supplier.code} ${editingSupplier ? 'updated' : 'created'} successfully`,
      })
    },
    [editingSupplier, toast]
  )

  // Pagination
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    setSelectedIds([])
  }, [])

  const handleLoadMore = useCallback(() => {
    if (pagination && page < pagination.pages) {
      setPage((p) => p + 1)
    }
  }, [pagination, page])

  // Offline error state
  if (isOffline) {
    return (
      <div>
        <PlanningHeader currentPage="suppliers" />
        <div className="px-6 py-6">
          <div className="flex flex-col items-center justify-center py-16" data-testid="error-offline">
            <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No Internet Connection</h2>
            <p className="text-muted-foreground mt-2">Please check your connection and try again.</p>
            <Button
              className="mt-6"
              onClick={() => refetchSuppliers()}
              data-testid="button-retry"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // API Error state
  if (suppliersError && !loadingSuppliers) {
    return (
      <div>
        <PlanningHeader currentPage="suppliers" />
        <div className="px-6 py-6">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold">Failed to Load Suppliers</h2>
            <p className="text-muted-foreground mt-2">
              Unable to retrieve supplier data. Please check your connection and try again.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Error: SUPPLIER_LIST_FETCH_FAILED
            </p>
            <div className="flex gap-4 mt-6">
              <Button onClick={() => refetchSuppliers()} data-testid="button-retry">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button variant="outline">Contact Support</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check for filtered empty state vs true empty state
  const hasFiltersApplied =
    filters.status !== 'all' ||
    filters.search ||
    filters.payment_terms ||
    filters.currency.length > 0

  const isEmptyState = !loadingSuppliers && suppliers.length === 0 && !hasFiltersApplied
  const isFilteredEmptyState = !loadingSuppliers && suppliers.length === 0 && hasFiltersApplied

  return (
    <div>
      <PlanningHeader currentPage="suppliers" />

      <div className="px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Suppliers</h1>
            <p className="text-muted-foreground text-sm">
              Manage supplier information and product assignments
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button
              onClick={() => {
                setEditingSupplier(null)
                setCreateModalOpen(true)
              }}
              data-testid="button-create-supplier"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Supplier
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <SupplierListKPIs
          summary={summary}
          loading={loadingSummary}
          onFilterChange={handleKPIFilterChange}
        />

        {/* Empty State */}
        {isEmptyState && (
          <div
            className="flex flex-col items-center justify-center py-16 border rounded-lg"
            data-testid="empty-state-suppliers"
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No Suppliers Yet</h2>
            <p className="text-muted-foreground mt-2 text-center max-w-md">
              Create your first supplier to start managing vendors and procurement. You can also
              bulk import from Excel.
            </p>
            <div className="flex gap-4 mt-6">
              <Button
                onClick={() => {
                  setEditingSupplier(null)
                  setCreateModalOpen(true)
                }}
                data-testid="button-create-supplier"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Supplier
              </Button>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import from Excel
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-8">
              Quick Tip: Set up suppliers before creating purchase orders.
              <br />
              Lead time and MOQ are managed at the product level.
            </p>
          </div>
        )}

        {/* Filtered Empty State */}
        {isFilteredEmptyState && (
          <>
            <SupplierFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isMobile={isMobile}
            />
            <div className="flex flex-col items-center justify-center py-16 border rounded-lg">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FilterX className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">No Suppliers Match Filters</h2>
              <p className="text-muted-foreground mt-2">
                No suppliers found matching your current filters. Try adjusting your search
                criteria.
              </p>
              <Button className="mt-6" variant="outline" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            </div>
          </>
        )}

        {/* Data State */}
        {!isEmptyState && !isFilteredEmptyState && (
          <>
            {/* Filters */}
            <SupplierFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isMobile={isMobile}
            />

            {/* Bulk Actions */}
            <SupplierBulkActions
              selectedIds={selectedIds}
              selectedSuppliers={selectedSuppliers}
              allSelected={allSelected}
              someSelected={someSelected}
              onSelectAll={handleSelectAll}
              onDeactivate={handleBulkDeactivate}
              onActivate={handleBulkActivate}
              onExport={handleExport}
              loading={loadingSuppliers}
            />

            {/* Table */}
            <SupplierListTable
              data={suppliers}
              selectedIds={selectedIds}
              loading={loadingSuppliers}
              pagination={pagination}
              isMobile={isMobile}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
              onDelete={handleDelete}
              onPageChange={handlePageChange}
              onLoadMore={handleLoadMore}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortOrder={sortOrder}
            />
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <SupplierCreateEditModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          setEditingSupplier(null)
        }}
        supplier={editingSupplier}
        onSuccess={handleCreateSuccess}
      />

      {/* Delete Modal */}
      <SupplierDeleteModal
        open={!!deletingSupplier}
        supplier={deletingSupplier}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeletingSupplier(null)
          setDeleteError(null)
        }}
        loading={deleteSupplier.isPending}
        error={deleteError}
      />

      {/* Toast for Success Messages */}
      <div data-testid="toast-success" className="hidden" />
    </div>
  )
}
