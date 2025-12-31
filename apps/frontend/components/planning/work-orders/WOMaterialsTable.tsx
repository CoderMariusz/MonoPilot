/**
 * WO Materials Table - Story 03.11a
 *
 * Materials list table for WO detail page
 * Displays BOM snapshot materials with all 4 states:
 * - Loading: Skeleton rows
 * - Error: Error message with retry
 * - Empty: Empty state message
 * - Success: Materials table
 *
 * @module components/planning/work-orders/WOMaterialsTable
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { AlertCircle, Package, RefreshCw } from 'lucide-react'

import { useWOMaterials } from '@/lib/hooks/use-wo-materials'
import { WOMaterialRow } from './WOMaterialRow'
import { WOMaterialCard } from './WOMaterialCard'
import { RefreshSnapshotButton } from './RefreshSnapshotButton'

interface WOMaterialsTableProps {
  woId: string
  woStatus: string
  onRefresh?: () => void
}

/**
 * Loading skeleton for materials table
 */
function MaterialsSkeleton() {
  return (
    <div data-testid="materials-skeleton" className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-8" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/**
 * Empty state when no materials
 */
function MaterialsEmptyState({ woStatus }: { woStatus: string }) {
  const canRefresh = ['draft', 'planned'].includes(woStatus)

  return (
    <div
      data-testid="materials-empty-state"
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <Package className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No materials found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {canRefresh
          ? 'This work order has no materials assigned. Select a BOM and refresh to populate materials.'
          : 'This work order has no materials assigned.'}
      </p>
    </div>
  )
}

/**
 * Error state with retry
 */
function MaterialsErrorState({
  error,
  onRetry,
}: {
  error: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-medium">Failed to load materials</h3>
      <p className="text-sm text-muted-foreground mt-1">{error}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-4"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}

/**
 * Materials summary footer
 */
function MaterialsSummary({
  total,
  bomVersion,
}: {
  total: number
  bomVersion: number | null
}) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4 mt-4">
      <span>
        {total} material{total !== 1 ? 's' : ''}
      </span>
      {bomVersion && <span>BOM Version: {bomVersion}</span>}
    </div>
  )
}

/**
 * Materials table component
 *
 * @param woId - UUID of the Work Order
 * @param woStatus - Current WO status
 * @param onRefresh - Callback after successful refresh
 *
 * @example
 * ```tsx
 * <WOMaterialsTable
 *   woId={wo.id}
 *   woStatus={wo.status}
 *   onRefresh={() => refetchWO()}
 * />
 * ```
 */
export function WOMaterialsTable({
  woId,
  woStatus,
  onRefresh,
}: WOMaterialsTableProps) {
  const { data, isLoading, error, refetch } = useWOMaterials(woId)

  // Loading state
  if (isLoading) {
    return <MaterialsSkeleton />
  }

  // Error state
  if (error) {
    return (
      <MaterialsErrorState
        error={error.message}
        onRetry={() => refetch()}
      />
    )
  }

  // Empty state
  if (!data?.materials.length) {
    return (
      <div data-testid="wo-materials-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Materials Required (BOM Snapshot)
          </h3>
          <RefreshSnapshotButton
            woId={woId}
            woStatus={woStatus}
            onSuccess={onRefresh}
          />
        </div>
        <MaterialsEmptyState woStatus={woStatus} />
      </div>
    )
  }

  // Success state
  return (
    <div data-testid="wo-materials-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Materials Required (BOM Snapshot
          {data.bom_version ? ` v${data.bom_version}` : ''}
          {['released', 'in_progress', 'completed', 'closed'].includes(woStatus)
            ? ' - Immutable'
            : ''}
          )
        </h3>
        <RefreshSnapshotButton
          woId={woId}
          woStatus={woStatus}
          onSuccess={onRefresh}
        />
      </div>

      {/* Desktop/Tablet: Table view (>= 768px) */}
      <div className="hidden md:block border rounded-lg">
        <Table data-testid="wo-materials-table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Consumed</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead className="hidden lg:table-cell">Status</TableHead>
              <TableHead className="w-16 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.materials.map((material) => (
              <WOMaterialRow key={material.id} material={material} />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Card view (< 768px) */}
      <div className="md:hidden space-y-3">
        {data.materials.map((material) => (
          <WOMaterialCard key={material.id} material={material} />
        ))}
      </div>

      <MaterialsSummary total={data.total} bomVersion={data.bom_version} />
    </div>
  )
}
