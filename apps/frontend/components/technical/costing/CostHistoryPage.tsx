'use client'

/**
 * CostHistoryPage Component (Story 02.15)
 * Main page component orchestrating all cost history sections
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, AlertCircle, LineChart as ChartIcon, RotateCcw } from 'lucide-react'
import { useCostHistory } from '@/lib/hooks/use-cost-history'
import { useVarianceReport } from '@/lib/hooks/use-variance-report'
import { CostSummaryCard } from './CostSummaryCard'
import { CostHistoryFilters, DEFAULT_FILTERS } from './CostHistoryFilters'
import type { CostHistoryFiltersState } from './CostHistoryFilters'
import { CostTrendChart } from './CostTrendChart'
import type { ChartToggles } from './CostTrendChart'
import { ComponentBreakdownTable } from './ComponentBreakdownTable'
import { CostDriversPanel } from './CostDriversPanel'
import { CostHistoryTable } from './CostHistoryTable'
import { VarianceAnalysisSection } from './VarianceAnalysisSection'
import { ExportOptionsModal } from './ExportOptionsModal'
import type { CostHistoryItem } from '@/lib/types/cost-history'

export interface CostHistoryPageProps {
  /** Product ID to display history for */
  productId: string
}

export function CostHistoryPage({ productId }: CostHistoryPageProps) {
  const router = useRouter()

  // State
  const [filters, setFilters] = useState<CostHistoryFiltersState>(DEFAULT_FILTERS)
  const [chartToggles, setChartToggles] = useState<ChartToggles>({
    material: true,
    labor: true,
    overhead: true,
    total: true,
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [variancePeriod, setVariancePeriod] = useState(30)
  const [comparisonPeriod, setComparisonPeriod] = useState<'1mo' | '3mo' | '6mo' | '1yr'>('3mo')
  const [showExportModal, setShowExportModal] = useState(false)

  // Data fetching
  const {
    data: costHistoryData,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useCostHistory(productId, {
    from: filters.from || undefined,
    to: filters.to || undefined,
    type: filters.costType === 'all' ? undefined : filters.costType,
    page,
    limit,
  })

  const {
    data: varianceData,
    isLoading: isLoadingVariance,
  } = useVarianceReport(productId, variancePeriod)

  // Handlers
  const handleFilterChange = useCallback((newFilters: CostHistoryFiltersState) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page on filter change
    // Chart toggles sync with filter components
    setChartToggles({
      material: newFilters.components.material,
      labor: newFilters.components.labor,
      overhead: newFilters.components.overhead,
      total: true,
    })
  }, [])

  const handleFilterReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
    setChartToggles({
      material: true,
      labor: true,
      overhead: true,
      total: true,
    })
  }, [])

  const handleChartToggleChange = useCallback((component: string, value: boolean) => {
    setChartToggles((prev) => ({
      ...prev,
      [component]: value,
    }))
    // Sync with filters
    if (component !== 'total') {
      setFilters((prev) => ({
        ...prev,
        components: {
          ...prev.components,
          [component]: value,
        },
      }))
    }
  }, [])

  const handlePointClick = useCallback((item: CostHistoryItem) => {
    // TODO: Implement navigation to cost detail page
    // router.push(`/technical/costing/products/${productId}/history/${item.id}`)
  }, [productId])

  const handleRowClick = useCallback((item: CostHistoryItem) => {
    // TODO: Implement row click handler or remove if not needed
  }, [])

  const handleViewLatest = useCallback(() => {
    router.push(`/technical/costing/products/${productId}`)
  }, [router, productId])

  const handleViewDetailedReport = useCallback(() => {
    router.push(`/technical/costing/products/${productId}/variance`)
  }, [router, productId])

  const handleBack = useCallback(() => {
    router.push(`/technical/costing/products/${productId}`)
  }, [router, productId])

  const handleExport = useCallback(() => {
    setShowExportModal(true)
  }, [])

  const handleExportAction = useCallback((config: { format: string; includeChart: boolean }) => {
    // TODO: Implement export functionality in Phase 2C-3
    // For now, just close the modal - actual export will be implemented later
  }, [])

  // Loading state
  if (isLoadingHistory) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Costing
          </Button>
        </div>

        <div className="text-center py-16">
          <div className="animate-spin mx-auto mb-4">
            <ChartIcon className="h-12 w-12 text-gray-300" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading Cost History...</h2>
          <p className="text-gray-500 mb-4">Fetching historical cost data...</p>
          <div className="w-64 mx-auto">
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isErrorHistory) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Costing
          </Button>
        </div>

        <div className="text-center py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Cost History</h2>
            <p className="text-gray-600 mb-4">
              {historyError?.message || 'An error occurred while loading cost history data.'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              If the problem persists, contact support.
            </p>
            <Button onClick={() => refetchHistory()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!costHistoryData || costHistoryData.history.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Costing
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-2">
          Cost History & Trends: {costHistoryData?.product?.name || 'Product'}
        </h1>
        {costHistoryData?.product?.code && (
          <p className="text-gray-500 mb-8">SKU: {costHistoryData.product.code}</p>
        )}

        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <ChartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Cost History Available</h2>
          <p className="text-gray-500 mb-6">
            This product doesn&apos;t have any cost calculations yet.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            To view cost history and trends:
            <br />
            1. Calculate recipe costing at least once
            <br />
            2. Historical data will appear here
          </p>
          <Button onClick={handleViewLatest}>Go to Recipe Costing</Button>
        </div>
      </div>
    )
  }

  // Success state (full data)
  const { product, summary, history, pagination, component_breakdown, cost_drivers } =
    costHistoryData

  // Find biggest cost driver
  const biggestDriver = cost_drivers.length > 0
    ? cost_drivers.reduce((max, driver) =>
        Math.abs(driver.impact_percent) > Math.abs(max.impact_percent) ? driver : max
      )
    : null

  // Check if limited view (< 3 data points)
  const isLimitedView = history.length < 3

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Costing
        </Button>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold">
          Cost History & Trends: {product.name}
        </h1>
        <p className="text-gray-500">SKU: {product.code}</p>
      </div>

      {/* Cost Summary Card */}
      <CostSummaryCard
        summary={summary}
        productCode={product.code}
        onViewLatest={handleViewLatest}
        currentDate={history[0]?.effective_from}
        previousDate={history[1]?.effective_from}
      />

      {/* Filters */}
      <CostHistoryFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onExport={handleExport}
      />

      {/* Cost Trend Chart */}
      {!isLimitedView && (
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Cost Trend Chart (Last 12 Months)</h2>
          <CostTrendChart
            data={history}
            toggles={chartToggles}
            onToggleChange={handleChartToggleChange}
            onPointClick={handlePointClick}
          />
        </div>
      )}

      {/* Limited view notice */}
      {isLimitedView && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">
            <strong>Limited Data:</strong> Only {history.length} cost calculation(s) available.
            More data points are needed for trend charts.
          </p>
        </div>
      )}

      {/* Two-column layout for breakdown and drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComponentBreakdownTable
          breakdown={component_breakdown}
          comparisonPeriod={comparisonPeriod}
          onPeriodChange={setComparisonPeriod}
        />

        <CostDriversPanel drivers={cost_drivers} biggestDriver={biggestDriver} />
      </div>

      {/* Cost History Table */}
      <CostHistoryTable
        data={history}
        pagination={{
          ...pagination,
          total_pages: pagination.total_pages || Math.ceil(pagination.total / limit),
        }}
        onPageChange={setPage}
        onRowClick={handleRowClick}
        onLimitChange={setLimit}
      />

      {/* Variance Analysis */}
      <VarianceAnalysisSection
        variance={varianceData || null}
        period={variancePeriod}
        onPeriodChange={setVariancePeriod}
        onViewDetailedReport={handleViewDetailedReport}
        isLoading={isLoadingVariance}
      />

      {/* Footer actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t">
        <Button variant="outline" onClick={handleBack}>
          Back to Costing
        </Button>
      </div>

      {/* Export Modal */}
      <ExportOptionsModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        productId={productId}
        dateRange={{
          from: filters.from ? new Date(filters.from) : null,
          to: filters.to ? new Date(filters.to) : null,
        }}
        onExport={handleExportAction}
      />
    </div>
  )
}
