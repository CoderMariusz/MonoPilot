/**
 * Expiring Items Tab Component
 * Story: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * Main container component for the Expiring Items tab with all states
 */

'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Download, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useExpiringItems } from '@/hooks/warehouse/useExpiringItems'
import { ExpiringDaysSlider } from './ExpiringDaysSlider'
import { ExpiringItemsSummary } from './ExpiringItemsSummary'
import { ExpiringItemsFilters } from './ExpiringItemsFilters'
import { ExpiringItemsBulkActions } from './ExpiringItemsBulkActions'
import { ExpiringItemsTable } from './ExpiringItemsTable'

interface ExpiringItemsTabProps {
  className?: string
}

/**
 * Loading skeleton for the entire tab
 */
function ExpiringItemsSkeleton() {
  return (
    <div className="space-y-6" data-testid="expiring-items-skeleton">
      {/* Slider skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-xl border">
            <Skeleton className="h-4 w-20 mb-4" />
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="p-4 rounded-lg border space-y-4">
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Error state component
 */
function ErrorState({
  error,
  onRetry,
}: {
  error: Error
  onRetry: () => void
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      data-testid="error-state"
    >
      <div className="rounded-full bg-red-100 p-6 mb-4">
        <AlertTriangle className="h-12 w-12 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to Load Expiring Items</h3>
      <p className="text-muted-foreground max-w-md mb-2">
        Unable to retrieve expiring inventory data. Please check your connection
        and try again.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-muted-foreground mb-6 font-mono">
          {error.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
        <Button variant="outline" onClick={() => window.open('/support', '_blank')}>
          Contact Support
        </Button>
      </div>
    </div>
  )
}

/**
 * Main Expiring Items Tab component
 */
export function ExpiringItemsTab({ className }: ExpiringItemsTabProps) {
  const {
    days,
    setDays,
    tierFilter,
    setTierFilter,
    filters,
    setFilters,
    selectedIds,
    setSelectedIds,
    page,
    setPage,
    data,
    isLoading,
    error,
    refetch,
    handleBulkAction,
    handleExportCSV,
    clearSelection,
  } = useExpiringItems()

  // Loading state
  if (isLoading && !data) {
    return <ExpiringItemsSkeleton />
  }

  // Error state
  if (error && !data) {
    return <ErrorState error={error} onRetry={refetch} />
  }

  return (
    <div
      className={cn('space-y-6', className)}
      data-testid="expiring-items-tab"
    >
      {/* Days slider */}
      <ExpiringDaysSlider
        days={days}
        onDaysChange={setDays}
        disabled={isLoading}
      />

      {/* Summary cards */}
      <ExpiringItemsSummary
        summary={data?.summary}
        onTierClick={setTierFilter}
        activeTier={tierFilter}
        isLoading={isLoading}
      />

      {/* Filters */}
      <ExpiringItemsFilters
        filters={filters}
        onFiltersChange={setFilters}
        tierFilter={tierFilter}
        onTierFilterChange={setTierFilter}
      />

      {/* Bulk actions toolbar */}
      <ExpiringItemsBulkActions
        selectedCount={selectedIds.length}
        onAction={handleBulkAction}
        onClear={clearSelection}
        isLoading={isLoading}
      />

      {/* Data table */}
      <ExpiringItemsTable
        data={data?.data || []}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        page={page}
        onPageChange={setPage}
        pagination={data?.pagination}
        isLoading={isLoading}
      />

      {/* Export button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={isLoading || !data?.data?.length}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
