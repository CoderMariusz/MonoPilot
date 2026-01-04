/**
 * License Plates List Page
 * Story 05.1: LP Table + CRUD
 * Story 05.5: LP Search & Filters
 * AC-8: LP list UI
 * AC-9: LP detail panel
 * AC-3: Create LP modal
 * AC-4: Status management
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { Plus, FileSpreadsheet, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Pagination } from '@/components/ui/pagination'
import {
  LPKPICards,
  LPSearchInput,
  LPFilterChips,
  LPAdvancedFilters,
  LPDataTable,
  LPDetailPanel,
  CreateLPModal,
  LPEmptyState,
  LPErrorState,
} from '@/components/warehouse'
import type { AppliedFilter } from '@/components/warehouse'
import {
  useLicensePlates,
  useLicensePlate,
  useBlockLP,
  useUnblockLP,
  useUpdateQAStatus,
} from '@/lib/hooks/use-license-plates'
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import type { LPListItem, LPFilterParams } from '@/lib/types/license-plate'

export default function LicensePlatesPage() {
  const { toast } = useToast()

  // Filters state
  const [filters, setFilters] = useState<LPFilterParams>({
    status: [],
    qa_status: [],
    warehouse_id: null,
    location_id: null,
    product_id: null,
    search: '',
    expiry_before: null,
    expiry_after: null,
  })
  const [page, setPage] = useState(1)
  const limit = 50

  // Detail panel state
  const [selectedLPId, setSelectedLPId] = useState<string | null>(null)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Advanced filters panel state
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  // Fetch data
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses({})
  const { data: lpsData, isLoading, error, refetch } = useLicensePlates({
    ...filters,
    page,
    limit,
    sort: 'created_at',
    order: 'desc',
  })

  const { data: selectedLP } = useLicensePlate(selectedLPId)

  const lps = lpsData?.data || []
  const totalPages = lpsData?.meta?.pages || 1

  // Mutations
  const blockLP = useBlockLP()
  const unblockLP = useUnblockLP()
  const updateQAStatus = useUpdateQAStatus()

  // Handlers
  const handleFilterChange = useCallback((newFilters: Partial<LPFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1)
  }, [])

  const handleKPICardClick = useCallback(
    (type: 'total' | 'available' | 'reserved' | 'expiring') => {
      switch (type) {
        case 'total':
          setFilters((prev) => ({ ...prev, status: [], qa_status: [] }))
          break
        case 'available':
          setFilters((prev) => ({ ...prev, status: ['available'], qa_status: ['passed'] }))
          break
        case 'reserved':
          setFilters((prev) => ({ ...prev, status: ['reserved'] }))
          break
        case 'expiring':
          // Would need to implement expiry filter logic
          break
      }
      setPage(1)
    },
    []
  )

  const handleRowClick = useCallback((lp: LPListItem) => {
    setSelectedLPId(lp.id)
    setDetailPanelOpen(true)
  }, [])

  const handleBlock = useCallback(
    async (lp: LPListItem) => {
      try {
        await blockLP.mutateAsync({
          id: lp.id,
          input: { reason: 'Blocked by user' },
        })
        toast({
          title: 'Success',
          description: `${lp.lp_number} has been blocked`,
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to block LP',
          variant: 'destructive',
        })
      }
    },
    [blockLP, toast]
  )

  const handleUnblock = useCallback(
    async (lp: LPListItem) => {
      try {
        await unblockLP.mutateAsync(lp.id)
        toast({
          title: 'Success',
          description: `${lp.lp_number} has been unblocked`,
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to unblock LP',
          variant: 'destructive',
        })
      }
    },
    [unblockLP, toast]
  )

  const handleUpdateQA = useCallback((lp: LPListItem) => {
    // Open QA status update dialog (future implementation)
    toast({
      title: 'Coming Soon',
      description: 'QA status update dialog will be implemented',
    })
  }, [toast])

  const handleCreate = useCallback(() => {
    setCreateModalOpen(true)
  }, [])

  const handleExport = useCallback(() => {
    toast({
      title: 'Coming Soon',
      description: 'Export functionality will be implemented',
    })
  }, [toast])

  const handlePrintLabels = useCallback(() => {
    toast({
      title: 'Coming Soon',
      description: 'Label printing will be implemented',
    })
  }, [toast])

  const handleSearch = useCallback((searchValue: string) => {
    setFilters((prev) => ({ ...prev, search: searchValue }))
    setPage(1)
  }, [])

  const handleApplyFilters = useCallback(() => {
    setFilterPanelOpen(false)
    setPage(1)
  }, [])

  const handleClearAllFilters = useCallback(() => {
    setFilters({
      status: [],
      qa_status: [],
      warehouse_id: null,
      location_id: null,
      product_id: null,
      search: '',
      expiry_before: null,
      expiry_after: null,
    })
    setPage(1)
  }, [])

  const handleRemoveFilter = useCallback((filterKey: string) => {
    setFilters((prev) => {
      const updated = { ...prev }
      switch (filterKey) {
        case 'search':
          updated.search = ''
          break
        case 'status':
          updated.status = []
          break
        case 'qa_status':
          updated.qa_status = []
          break
        case 'warehouse':
          updated.warehouse_id = null
          updated.location_id = null // Clear location when warehouse is cleared
          break
        case 'location':
          updated.location_id = null
          break
        case 'product':
          updated.product_id = null
          break
        case 'expiry':
          updated.expiry_before = null
          updated.expiry_after = null
          break
        default:
          break
      }
      return updated
    })
    setPage(1)
  }, [])

  // Convert filters to chips
  const appliedFilters = useMemo<AppliedFilter[]>(() => {
    const chips: AppliedFilter[] = []

    if (filters.search) {
      chips.push({
        key: 'search',
        label: 'Search',
        value: filters.search,
        displayText: `Search: ${filters.search}`,
      })
    }

    if (filters.status && filters.status.length > 0) {
      chips.push({
        key: 'status',
        label: 'Status',
        value: filters.status.join(', '),
        displayText: `Status: ${filters.status.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}`,
      })
    }

    if (filters.qa_status && filters.qa_status.length > 0) {
      chips.push({
        key: 'qa_status',
        label: 'QA Status',
        value: filters.qa_status.join(', '),
        displayText: `QA: ${filters.qa_status.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}`,
      })
    }

    if (filters.warehouse_id && warehouses?.data) {
      const warehouse = warehouses.data.find((w) => w.id === filters.warehouse_id)
      if (warehouse) {
        chips.push({
          key: 'warehouse',
          label: 'Warehouse',
          value: warehouse.name,
          displayText: `Warehouse: ${warehouse.name}`,
        })
      }
    }

    if (filters.product_id) {
      chips.push({
        key: 'product',
        label: 'Product',
        value: filters.product_id,
        displayText: `Product: Selected`,
      })
    }

    if (filters.expiry_before || filters.expiry_after) {
      const from = filters.expiry_after ? new Date(filters.expiry_after).toLocaleDateString() : 'any'
      const to = filters.expiry_before ? new Date(filters.expiry_before).toLocaleDateString() : 'any'
      chips.push({
        key: 'expiry',
        label: 'Expiry',
        value: `${from} - ${to}`,
        displayText: `Expiry: ${from} - ${to}`,
      })
    }

    return chips
  }, [filters, warehouses?.data])

  // Render states
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">License Plates</h1>
            <p className="text-muted-foreground text-sm">Atomic inventory tracking units</p>
          </div>
        </div>
        <LPErrorState onRetry={() => refetch()} />
      </div>
    )
  }

  const isEmpty = !isLoading && lps.length === 0 && !filters.search && (!filters.status || filters.status.length === 0)
  const isFiltered = !isLoading && lps.length === 0 && (filters.search || (filters.status && filters.status.length > 0))

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">License Plates</h1>
          <p className="text-muted-foreground text-sm">Atomic inventory tracking units</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintLabels} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Labels
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreate} className="gap-2" data-testid="create-lp-button">
            <Plus className="h-4 w-4" />
            Create LP
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <LPKPICards onCardClick={handleKPICardClick} />

      {/* Search Bar and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <LPSearchInput
          value={filters.search || ''}
          onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          onSearch={handleSearch}
          loading={isLoading}
        />
        <LPAdvancedFilters
          open={filterPanelOpen}
          onOpenChange={setFilterPanelOpen}
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onClearAll={handleClearAllFilters}
          warehouses={warehouses?.data || []}
          isLoadingWarehouses={isLoadingWarehouses}
        />
      </div>

      {/* Filter Chips */}
      <LPFilterChips
        filters={appliedFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* Content */}
      {isEmpty ? (
        <LPEmptyState onCreateClick={handleCreate} />
      ) : isFiltered ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="filtered-empty-state">
          <h3 className="text-lg font-semibold mb-2">No License Plates Match Your Filters</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Try adjusting your filters or search criteria to find license plates.
          </p>
          <Button variant="outline" onClick={() => handleFilterChange({ status: [], qa_status: [], search: '' })}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <>
          <LPDataTable
            data={lps}
            isLoading={isLoading}
            onRowClick={handleRowClick}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            onUpdateQA={handleUpdateQA}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" data-testid="pagination">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  data-testid="pagination-prev"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  data-testid="pagination-next"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Panel */}
      <LPDetailPanel
        lp={selectedLP || null}
        open={detailPanelOpen}
        onClose={() => {
          setDetailPanelOpen(false)
          setSelectedLPId(null)
        }}
        onBlock={(id, reason) => {
          const lp = lps.find((l) => l.id === id)
          if (lp) handleBlock(lp)
        }}
        onUnblock={(id) => {
          const lp = lps.find((l) => l.id === id)
          if (lp) handleUnblock(lp)
        }}
        onUpdateQA={(id) => {
          const lp = lps.find((l) => l.id === id)
          if (lp) handleUpdateQA(lp)
        }}
      />

      {/* Create Modal */}
      <CreateLPModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        warehouses={warehouses?.data || []}
        products={[]} // Would need to fetch products
        onSuccess={() => refetch()}
      />
    </div>
  )
}
