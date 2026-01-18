/**
 * AgingReportTab Component
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Main container for the Aging Report tab in the Inventory Browser.
 * Includes FIFO/FEFO toggle, filters, chart, table, and top oldest widget.
 *
 * States:
 * - Loading: Shows skeleton
 * - Error: Shows error message with retry
 * - Empty: Shows empty state with guidance
 * - Success: Shows chart, table, and widget
 */

'use client'

import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { useAgingReport } from '@/hooks/warehouse/useAgingReport'
import { AgingModeToggle } from './AgingModeToggle'
import { AgingReportFilters } from './AgingReportFilters'
import { AgingReportChart } from './AgingReportChart'
import { AgingReportTable } from './AgingReportTable'
import { TopOldestStockWidget } from './TopOldestStockWidget'
import { AgingReportSkeleton } from './AgingReportSkeleton'
import { AgingReportEmptyState } from './AgingReportEmptyState'
import { AgingReportErrorState } from './AgingReportErrorState'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface AgingReportTabProps {
  className?: string
}

export function AgingReportTab({ className }: AgingReportTabProps) {
  const { toast } = useToast()

  const {
    mode,
    setMode,
    filters,
    setFilters,
    page,
    setPage,
    data,
    topOldest,
    isLoading,
    isLoadingTopOldest,
    isExporting,
    error,
    refetch,
    handleExport,
  } = useAgingReport()

  // Handle export with toast notification
  const onExport = async () => {
    try {
      await handleExport()
      toast({
        title: 'Export Complete',
        description: 'Aging report has been downloaded successfully.',
      })
    } catch (err) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export aging report. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Loading state
  if (isLoading) {
    return <AgingReportSkeleton />
  }

  // Error state
  if (error) {
    return (
      <AgingReportErrorState
        error={error}
        onRetry={() => refetch()}
      />
    )
  }

  // Empty state
  if (!data || data.data.length === 0) {
    return <AgingReportEmptyState mode={mode} />
  }

  // Success state
  return (
    <div className={cn('space-y-6', className)} data-testid="aging-report-tab">
      {/* Header: Mode Toggle, Filters, Export */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <AgingModeToggle
          value={mode}
          onChange={setMode}
          disabled={isLoading}
        />

        <div className="flex flex-wrap items-end gap-3">
          <AgingReportFilters
            filters={filters}
            onFiltersChange={setFilters}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting || isLoading}
            className="h-10"
            aria-label="Export aging report to CSV"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Chart */}
      <AgingReportChart
        data={data.summary}
        mode={mode}
      />

      {/* Table and Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table - takes 2/3 on large screens */}
        <div className="lg:col-span-2">
          <AgingReportTable
            data={data.data}
            mode={mode}
            page={page}
            onPageChange={setPage}
          />
        </div>

        {/* Top Oldest Widget - takes 1/3 on large screens */}
        <div>
          <TopOldestStockWidget
            items={topOldest || []}
            mode={mode}
            isLoading={isLoadingTopOldest}
          />
        </div>
      </div>
    </div>
  )
}
