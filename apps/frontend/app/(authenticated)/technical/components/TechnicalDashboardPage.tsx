'use client'

/**
 * TechnicalDashboardPage Component (Story 02.12)
 * Main dashboard page layout with all 6 widgets
 *
 * Layout:
 * - Desktop: 4 stats cards row, 2-column panels
 * - Tablet: 2x2 stats cards, single-column panels
 * - Mobile: Single column, all stacked
 *
 * States: Loading, Empty, Error, Success
 */

import { useState, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ClipboardList, Settings, DollarSign, Factory, AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useDashboardStats,
  useAllergenMatrix,
  useBomTimeline,
  useRecentActivity,
  useCostTrends
} from '@/lib/hooks/use-dashboard'
import { TechnicalHeader } from '@/components/technical/TechnicalHeader'

// Components
import { DashboardStatsCard, DashboardStatsCardSkeleton } from './DashboardStatsCard'
import { AllergenMatrixPanel } from './AllergenMatrixPanel'
import { BomTimelinePanel } from './BomTimelinePanel'
import { RecentActivityPanel } from './RecentActivityPanel'
import { QuickActionsBar } from './QuickActionsBar'

// Lazy load chart component for code splitting
const CostTrendsChart = lazy(() => import('./CostTrendsChart'))

// Empty State Component
function DashboardEmptyState({ onCreateProduct }: { onCreateProduct: () => void }) {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Factory className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Welcome to Technical Module
        </h2>
        <p className="text-gray-500 text-center max-w-md mb-6">
          No data yet. Start by creating products, BOMs, and routings.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onCreateProduct}>
            Create Your First Product
          </Button>
          <Button variant="outline" disabled>
            Create First BOM
          </Button>
          <Button variant="outline" disabled>
            Create First Routing
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Error State Component
function DashboardErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Failed to Load Dashboard Data
        </h2>
        <p className="text-gray-500 text-center max-w-md mb-6">
          Unable to retrieve dashboard statistics. Please try again.
        </p>
        <div className="flex gap-3">
          <Button onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button variant="outline" onClick={() => window.location.href = 'mailto:support@monopilot.com'}>
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function TechnicalDashboardPage() {
  const router = useRouter()
  const [productTypeFilter, setProductTypeFilter] = useState<string | undefined>(undefined)
  const [bomProductFilter, setBomProductFilter] = useState<string | undefined>(undefined)

  // Data hooks
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useDashboardStats()

  const {
    data: allergenMatrix,
    isLoading: matrixLoading,
    error: matrixError,
    refetch: refetchMatrix
  } = useAllergenMatrix(productTypeFilter)

  const {
    data: bomTimeline,
    isLoading: timelineLoading,
    error: timelineError,
    refetch: refetchTimeline
  } = useBomTimeline(bomProductFilter)

  const {
    data: recentActivity,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity
  } = useRecentActivity(10)

  const {
    data: costTrends,
    isLoading: costsLoading,
    error: costsError,
    refetch: refetchCosts
  } = useCostTrends(6)

  // Check if organization is empty (no products, no BOMs, no routings)
  const isEmpty = stats?.products.total === 0 &&
    stats?.boms.total === 0 &&
    stats?.routings.total === 0

  // Check if any critical error occurred
  const hasCriticalError = statsError && !stats

  // Refresh all data
  const handleRefreshAll = () => {
    refetchStats()
    refetchMatrix()
    refetchTimeline()
    refetchActivity()
    refetchCosts()
  }

  // Navigation handlers
  const handleNewProduct = () => {
    router.push('/technical/products?action=create')
  }

  const handleNewBom = () => {
    router.push('/technical/boms?action=create')
  }

  const handleNewRouting = () => {
    router.push('/technical/routings?action=create')
  }

  // Handle PDF export
  const handleExportPdf = async () => {
    if (!allergenMatrix) return

    try {
      const { exportAllergenMatrixPdf } = await import('@/lib/services/dashboard-service')
      const blob = await exportAllergenMatrixPdf(allergenMatrix, 'current-org')

      // Download the PDF
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `allergen-matrix-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export PDF:', error)
    }
  }

  return (
    <div>
      <TechnicalHeader currentPage="dashboard" />

      <div className="px-4 md:px-6 py-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Technical Dashboard</h1>
            <p className="text-gray-500">Overview of products, BOMs, routings, and costs</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="mt-4 sm:mt-0"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Critical Error State */}
        {hasCriticalError && (
          <DashboardErrorState onRetry={handleRefreshAll} />
        )}

        {/* Empty State */}
        {!hasCriticalError && isEmpty && !statsLoading && (
          <DashboardEmptyState onCreateProduct={handleNewProduct} />
        )}

        {/* Main Content */}
        {!hasCriticalError && !isEmpty && (
          <>
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statsLoading ? (
                <>
                  <DashboardStatsCardSkeleton />
                  <DashboardStatsCardSkeleton />
                  <DashboardStatsCardSkeleton />
                  <DashboardStatsCardSkeleton />
                </>
              ) : (
                <>
                  {/* Products Card */}
                  <DashboardStatsCard
                    icon={Package}
                    title="Products"
                    value={stats?.products.total ?? 0}
                    breakdown={[
                      { label: 'Active', value: stats?.products.active ?? 0, type: 'active' },
                      { label: 'Inactive', value: stats?.products.inactive ?? 0, type: 'inactive' }
                    ]}
                    href="/technical/products"
                    data-testid="stats-card-products"
                  />

                  {/* BOMs Card */}
                  <DashboardStatsCard
                    icon={ClipboardList}
                    title="BOMs"
                    value={stats?.boms.total ?? 0}
                    breakdown={[
                      { label: 'Active', value: stats?.boms.active ?? 0, type: 'active' },
                      { label: 'Phased', value: stats?.boms.phased ?? 0, type: 'phased' }
                    ]}
                    href="/technical/boms"
                    data-testid="stats-card-boms"
                  />

                  {/* Routings Card */}
                  <DashboardStatsCard
                    icon={Settings}
                    title="Routings"
                    value={stats?.routings.total ?? 0}
                    breakdown={[
                      { label: 'Reusable', value: stats?.routings.reusable ?? 0, type: 'default' }
                    ]}
                    href="/technical/routings"
                    data-testid="stats-card-routings"
                  />

                  {/* Avg Cost Card */}
                  <DashboardStatsCard
                    icon={DollarSign}
                    title="Avg Cost"
                    value={`${stats?.avg_cost.value?.toFixed(2) ?? '0.00'} ${stats?.avg_cost.currency ?? 'PLN'}`}
                    trend={stats?.avg_cost.trend_percent && stats.avg_cost.trend_percent > 0 ? {
                      percent: stats.avg_cost.trend_percent,
                      direction: stats.avg_cost.trend_direction
                    } : undefined}
                    href="/technical/costing/history"
                    data-testid="stats-card-avg-cost"
                  />
                </>
              )}
            </div>

            {/* Main Grid: Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
              {/* Left Column (3/5) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Allergen Matrix Panel */}
                <AllergenMatrixPanel
                  data={allergenMatrix}
                  loading={matrixLoading}
                  error={matrixError?.message}
                  onRetry={() => refetchMatrix()}
                  onProductTypeChange={setProductTypeFilter}
                  onExportPdf={handleExportPdf}
                />

                {/* Recent Activity Panel */}
                <RecentActivityPanel
                  data={recentActivity}
                  loading={activityLoading}
                  error={activityError?.message}
                  onRetry={() => refetchActivity()}
                />
              </div>

              {/* Right Column (2/5) */}
              <div className="lg:col-span-2 space-y-6">
                {/* BOM Timeline Panel */}
                <BomTimelinePanel
                  data={bomTimeline}
                  loading={timelineLoading}
                  error={timelineError?.message}
                  onRetry={() => refetchTimeline()}
                  onProductFilterChange={setBomProductFilter}
                />

                {/* Cost Trends Chart */}
                <Suspense fallback={<Skeleton className="h-[350px] w-full rounded-lg" />}>
                  <CostTrendsChart
                    data={costTrends}
                    loading={costsLoading}
                    error={costsError?.message}
                    onRetry={() => refetchCosts()}
                  />
                </Suspense>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <QuickActionsBar
              onNewProduct={handleNewProduct}
              onNewBom={handleNewBom}
              onNewRouting={handleNewRouting}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default TechnicalDashboardPage
