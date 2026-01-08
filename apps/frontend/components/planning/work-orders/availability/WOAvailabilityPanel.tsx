/**
 * WO Availability Panel Component - Story 03.13
 *
 * Main container panel displaying material availability for a Work Order.
 * Shows summary card, filter controls, and materials list with all 4 states:
 * Loading, Empty, Error, Success.
 *
 * @module components/planning/work-orders/availability/WOAvailabilityPanel
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { Package, AlertCircle, Info, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type {
  WOAvailabilityResponse,
  MaterialAvailability,
  AvailabilityStatus,
} from '@/lib/types/wo-availability'
import { getMaterialsWithIssues } from '@/lib/types/wo-availability'
import { useWOAvailability, useRefreshAvailability } from '@/lib/hooks/use-wo-availability'

import { AvailabilitySummaryCard } from './AvailabilitySummaryCard'
import { AvailabilityMaterialRow, AvailabilityMaterialCard } from './AvailabilityMaterialRow'

export interface WOAvailabilityPanelProps {
  woId: string
  defaultCollapsed?: boolean
  showInModal?: boolean
  className?: string
}

type FilterStatus = 'all' | AvailabilityStatus

/**
 * Loading skeleton for the panel
 */
function LoadingSkeleton({ showInModal }: { showInModal?: boolean }) {
  return (
    <Card className={cn('w-full', showInModal && 'border-0 shadow-none')}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-48" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded" />
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Checking material availability...
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Empty state when WO has no materials
 */
function EmptyState({ showInModal }: { showInModal?: boolean }) {
  return (
    <Card className={cn('w-full', showInModal && 'border-0 shadow-none')}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Materials to Check</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          This Work Order has no materials in its BOM snapshot.
          Material availability check requires at least one material.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            View BOM
          </Button>
          <Button variant="outline" size="sm">
            Add Materials
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error state when availability check fails
 */
function ErrorState({
  error,
  onRetry,
  showInModal,
}: {
  error: Error
  onRetry: () => void
  showInModal?: boolean
}) {
  return (
    <Card className={cn('w-full', showInModal && 'border-0 shadow-none')}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 bg-red-100 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Failed to Check Material Availability</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-2">
          Unable to retrieve inventory data. This may be due to a network
          issue or server error. The WO can still be saved without availability check.
        </p>
        <p className="text-xs text-red-600 mb-4">
          Error: {error.message || 'AVAILABILITY_CHECK_FAILED'}
        </p>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={onRetry}>
            Retry
          </Button>
          <Button variant="outline" size="sm">
            Continue Without Check
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Disabled state when setting is off
 */
function DisabledState({ showInModal }: { showInModal?: boolean }) {
  return (
    <Card className={cn('w-full', showInModal && 'border-0 shadow-none')}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 bg-blue-100 rounded-full mb-4">
          <Info className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Material Availability Check Disabled</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          Material availability checking is disabled in Planning Settings.
          Contact your administrator to enable this feature.
        </p>
        <Button variant="outline" size="sm" asChild>
          <a href="/settings/planning">
            <Settings className="h-4 w-4 mr-2" />
            Go to Settings
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Filter and sort materials based on user selection
 */
function filterMaterials(
  materials: MaterialAvailability[],
  filterStatus: FilterStatus,
  searchQuery: string
): MaterialAvailability[] {
  return materials.filter((m) => {
    // Filter by status
    if (filterStatus !== 'all' && m.status !== filterStatus) {
      return false
    }
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        m.product_name.toLowerCase().includes(query) ||
        m.product_code.toLowerCase().includes(query)
      )
    }
    return true
  })
}

/**
 * Main availability panel component
 *
 * Features:
 * - Collapsible panel (expanded by default when shortages exist)
 * - Summary card with overall status
 * - Filterable materials list
 * - Responsive layout (table on desktop, cards on mobile)
 * - Auto-refresh every 30 seconds
 *
 * @param woId - UUID of the Work Order
 * @param defaultCollapsed - Start collapsed (default: false)
 * @param showInModal - Render in modal style (no border)
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <WOAvailabilityPanel woId={workOrder.id} />
 * ```
 */
export function WOAvailabilityPanel({
  woId,
  defaultCollapsed = false,
  showInModal = false,
  className,
}: WOAvailabilityPanelProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, error, refetch, isFetching } = useWOAvailability(woId)
  const refreshAvailability = useRefreshAvailability()

  // Filter materials
  const filteredMaterials = useMemo(() => {
    if (!data?.materials) return []
    return filterMaterials(data.materials, filterStatus, searchQuery)
  }, [data?.materials, filterStatus, searchQuery])

  // Get materials with issues for summary card
  const criticalMaterials = useMemo(() => {
    if (!data?.materials) return []
    return getMaterialsWithIssues(data.materials).filter(
      (m) => m.status === 'shortage' || m.status === 'no_stock'
    )
  }, [data?.materials])

  const handleRefresh = useCallback(() => {
    refreshAvailability(woId)
  }, [refreshAvailability, woId])

  // Auto-expand when shortages detected
  const hasShortages = data?.summary?.shortage_count && data.summary.shortage_count > 0

  // Render states
  if (isLoading) {
    return <LoadingSkeleton showInModal={showInModal} />
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} showInModal={showInModal} />
  }

  if (!data?.enabled) {
    return <DisabledState showInModal={showInModal} />
  }

  if (!data?.materials?.length) {
    return <EmptyState showInModal={showInModal} />
  }

  // Success state
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={className}
    >
      <Card className={cn('w-full', showInModal && 'border-0 shadow-none')}>
        <CollapsibleTrigger asChild>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors pb-2"
            role="button"
            aria-expanded={isOpen}
            aria-label="Toggle availability panel"
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Availability Check
                {hasShortages && (
                  <span className="text-xs font-normal text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    {data.summary.shortage_count} shortage{data.summary.shortage_count > 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Summary Card */}
            <AvailabilitySummaryCard
              summary={data.summary}
              overallStatus={data.overall_status}
              checkedAt={data.checked_at}
              cached={data.cached}
              cacheExpiresAt={data.cache_expires_at}
              onRefresh={handleRefresh}
              isRefreshing={isFetching}
              criticalMaterials={criticalMaterials}
            />

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as FilterStatus)}
              >
                <SelectTrigger className="w-full sm:w-[140px]" aria-label="Filter by status">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sufficient">Sufficient</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="shortage">Shortage</SelectItem>
                  <SelectItem value="no_stock">No Stock</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                aria-label="Search materials"
              />
            </div>

            {/* Materials Table (Desktop) */}
            <div className="hidden md:block rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">St</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Required</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Shortage</TableHead>
                    <TableHead className="text-right">Coverage</TableHead>
                    <TableHead>UOM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => (
                    <AvailabilityMaterialRow
                      key={material.wo_material_id}
                      material={material}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Materials Cards (Mobile) */}
            <div className="md:hidden space-y-3">
              {filteredMaterials.map((material) => (
                <AvailabilityMaterialCard
                  key={material.wo_material_id}
                  material={material}
                />
              ))}
            </div>

            {/* Results Count */}
            <p className="text-sm text-muted-foreground text-center">
              Showing {filteredMaterials.length} of {data.materials.length} materials
            </p>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground justify-center">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500" /> Sufficient ({'\u2265'}100%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-yellow-500" /> Low Stock (50-99%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500" /> Shortage ({'<'}50%)
              </span>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

/**
 * Skeleton loader for WOAvailabilityPanel
 */
WOAvailabilityPanel.Skeleton = LoadingSkeleton

export default WOAvailabilityPanel
