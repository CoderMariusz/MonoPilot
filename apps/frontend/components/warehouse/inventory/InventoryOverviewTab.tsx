/**
 * Inventory Overview Tab Component
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 *
 * Main container component for the Overview Tab in Inventory Browser
 * Handles all 4 states: Loading, Error, Empty, Success
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { InventoryGroupingToggle, InventoryGroupingToggleMobile } from './InventoryGroupingToggle'
import { InventoryOverviewFilters } from './InventoryOverviewFilters'
import { InventoryOverviewTable } from './InventoryOverviewTable'
import { InventoryOverviewSummary, InventoryOverviewSummaryMobile } from './InventoryOverviewSummary'
import { useInventoryOverview } from '@/hooks/warehouse/useInventoryOverview'
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import { useLocations } from '@/lib/hooks/use-locations'
import { Package, AlertCircle, RefreshCw } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

// =============================================================================
// Loading State
// =============================================================================

function InventoryOverviewSkeleton() {
  return (
    <div className="space-y-6" data-testid="inventory-overview-skeleton">
      {/* Grouping Toggle Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="space-y-4 p-4 border rounded-lg bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg">
        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Empty State
// =============================================================================

interface EmptyStateProps {
  onNavigateToReceiving?: () => void
}

function InventoryEmptyState({ onNavigateToReceiving }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      data-testid="inventory-empty-state"
      role="status"
      aria-label="No inventory data"
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <Package className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Inventory Found</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Try adjusting your filters or receive new stock via Goods Receipt Notes (GRN) from
        Purchase Orders or Transfer Orders.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        {onNavigateToReceiving && (
          <Button onClick={onNavigateToReceiving}>Go to Receiving (GRN)</Button>
        )}
        <Button variant="outline" onClick={() => window.location.href = '/warehouse/purchase-orders'}>
          View Purchase Orders
        </Button>
      </div>
      <div className="mt-8 text-sm text-muted-foreground max-w-md">
        <p className="font-medium mb-2">Quick Tips:</p>
        <ul className="text-left space-y-1">
          <li>License Plates are created automatically during Goods Receipt</li>
          <li>Use the Inventory Browser to monitor stock by product, location, or warehouse</li>
          <li>Track aging inventory for FIFO/FEFO compliance</li>
        </ul>
      </div>
    </div>
  )
}

// =============================================================================
// Error State
// =============================================================================

interface ErrorStateProps {
  error: Error
  onRetry: () => void
}

function InventoryErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      data-testid="inventory-error-state"
      role="alert"
      aria-label="Error loading inventory"
    >
      <div className="rounded-full bg-red-100 p-6 mb-4">
        <AlertCircle className="h-12 w-12 text-red-600" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to Load Inventory Data</h3>
      <p className="text-muted-foreground max-w-md mb-2">
        Unable to retrieve inventory information. Please check your connection and try again.
      </p>
      <p className="text-sm text-red-600 mb-6 font-mono">
        {error.message || 'INVENTORY_FETCH_FAILED'}
      </p>
      <div className="flex gap-2">
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
        <Button variant="outline" onClick={() => window.open('/support', '_blank')}>
          Contact Support
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function InventoryOverviewTab() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isExporting, setIsExporting] = useState(false)

  // Data hooks
  const {
    groupBy,
    setGroupBy,
    filters,
    setFilters,
    clearFilters,
    page,
    setPage,
    data,
    pagination,
    summary,
    isLoading,
    isFetching,
    error,
    handleSort,
    sortColumn,
    sortDirection,
    refetch,
    exportCSV,
    exportExcel,
  } = useInventoryOverview()

  // Fetch warehouses and locations for filters
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses()
  const { locations = [], isLoading: isLoadingLocations } = useLocations(
    filters.warehouse_id || undefined
  )

  const warehouses = warehousesData?.data || []

  // Export handlers
  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      await exportCSV()
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await exportExcel()
    } finally {
      setIsExporting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return <InventoryOverviewSkeleton />
  }

  // Error state
  if (error) {
    return <InventoryErrorState error={error as Error} onRetry={refetch} />
  }

  // Empty state (no data after initial load)
  if (!data || data.length === 0) {
    // Check if filters are applied
    const hasFilters =
      filters.warehouse_id ||
      filters.location_id ||
      filters.status !== 'available' ||
      filters.search

    if (hasFilters) {
      // Filtered empty state
      return (
        <div className="space-y-6" data-testid="inventory-overview-tab">
          {/* Grouping Toggle */}
          {isMobile ? (
            <InventoryGroupingToggleMobile value={groupBy} onChange={setGroupBy} />
          ) : (
            <InventoryGroupingToggle value={groupBy} onChange={setGroupBy} />
          )}

          {/* Filters */}
          <InventoryOverviewFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearAll={clearFilters}
            warehouses={warehouses}
            locations={locations}
            isLoadingWarehouses={isLoadingWarehouses}
            isLoadingLocations={isLoadingLocations}
          />

          {/* Filtered Empty State */}
          <div
            className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg"
            data-testid="inventory-filtered-empty-state"
          >
            <Package className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Items Match Your Filters</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Try adjusting or clearing your filters to see inventory data.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>
      )
    }

    // True empty state (no inventory at all)
    return <InventoryEmptyState />
  }

  // Success state
  return (
    <div className="space-y-6" data-testid="inventory-overview-tab">
      {/* Grouping Toggle */}
      {isMobile ? (
        <InventoryGroupingToggleMobile value={groupBy} onChange={setGroupBy} disabled={isFetching} />
      ) : (
        <InventoryGroupingToggle value={groupBy} onChange={setGroupBy} disabled={isFetching} />
      )}

      {/* Filters */}
      <InventoryOverviewFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        warehouses={warehouses}
        locations={locations}
        isLoadingWarehouses={isLoadingWarehouses}
        isLoadingLocations={isLoadingLocations}
        disabled={isFetching}
      />

      {/* Table */}
      <InventoryOverviewTable
        data={data}
        groupBy={groupBy}
        pagination={pagination}
        onPageChange={setPage}
        onSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        isLoading={isFetching}
      />

      {/* Summary - Desktop */}
      {!isMobile && (
        <InventoryOverviewSummary
          summary={summary}
          pagination={pagination}
          onExportCSV={handleExportCSV}
          onExportExcel={handleExportExcel}
          isExporting={isExporting}
        />
      )}

      {/* Summary - Mobile */}
      {isMobile && (
        <InventoryOverviewSummaryMobile
          summary={summary}
          pagination={pagination}
          onExportCSV={handleExportCSV}
          onExportExcel={handleExportExcel}
          isExporting={isExporting}
        />
      )}
    </div>
  )
}
