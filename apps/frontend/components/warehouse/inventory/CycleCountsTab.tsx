/**
 * Cycle Counts Tab Component
 * Wireframe: WH-INV-001 - Cycle Counts Tab (Screen 5)
 * PRD: FR-023 (Cycle Count)
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, AlertTriangle, RefreshCw } from 'lucide-react'
import { CycleCountsSummaryCards } from './CycleCountsSummaryCards'
import { CycleCountsTable } from './CycleCountsTable'
import { useCycleCounts } from '@/hooks/warehouse/useCycleCounts'
import type { CycleCount, CycleCountStatus, CycleCountType } from '@/lib/types/cycle-count'

interface CycleCountsTabProps {
  onCreateClick?: () => void
  onCountClick?: (count: CycleCount) => void
}

// Loading skeleton
function CycleCountsSkeleton() {
  return (
    <div className="space-y-6" data-testid="cycle-counts-skeleton">
      {/* Summary cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      {/* Filters skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      {/* Table skeleton */}
      <div className="border rounded-lg p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Error state
function CycleCountsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      data-testid="cycle-counts-error"
      role="alert"
    >
      <div className="rounded-full bg-red-100 p-6 mb-4">
        <AlertTriangle className="h-12 w-12 text-red-600" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to Load Cycle Counts</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Unable to retrieve cycle count data. Please check your connection and try again.
      </p>
      <Button onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  )
}

// Empty state
function CycleCountsEmpty({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      data-testid="cycle-counts-empty"
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <Plus className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Cycle Counts Yet</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Create your first cycle count to start managing inventory accuracy.
        Cycle counts help maintain accurate stock levels and identify discrepancies.
      </p>
      {onCreateClick && (
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          New Cycle Count
        </Button>
      )}
      <div className="mt-8 text-sm text-muted-foreground max-w-md text-left">
        <p className="font-medium mb-2">Quick Tips:</p>
        <ul className="space-y-1">
          <li>Schedule regular cycle counts for high-value items</li>
          <li>Use partial counts for specific zones or locations</li>
          <li>Review variances to improve inventory accuracy</li>
        </ul>
      </div>
    </div>
  )
}

export function CycleCountsTab({ onCreateClick, onCountClick }: CycleCountsTabProps) {
  const {
    data,
    summary,
    pagination,
    filters,
    page,
    isLoading,
    error,
    setFilters,
    clearFilters,
    setPage,
    refetch,
    startCycleCount,
    completeCycleCount,
    cancelCycleCount,
  } = useCycleCounts()

  // Handle summary card click
  const handleSummaryCardClick = (type: 'planned' | 'in_progress' | 'completed' | 'with_variances') => {
    const statusMap: Record<string, CycleCountStatus | 'all'> = {
      planned: 'planned',
      in_progress: 'in_progress',
      completed: 'completed',
      with_variances: 'completed', // Filter completed with variances
    }
    setFilters({ status: statusMap[type] || 'all' })
  }

  // Handle row actions
  const handleStart = (count: CycleCount) => {
    startCycleCount(count.id)
  }

  const handleContinue = (count: CycleCount) => {
    // Navigate to count execution page
    onCountClick?.(count)
  }

  const handleComplete = (count: CycleCount) => {
    completeCycleCount(count.id)
  }

  const handleCancel = (count: CycleCount) => {
    cancelCycleCount(count.id)
  }

  const handleViewReport = (count: CycleCount) => {
    // Navigate to count report
    onCountClick?.(count)
  }

  const handleExport = (count: CycleCount) => {
    // Trigger export
    console.log('Export count:', count.id)
  }

  // Loading state
  if (isLoading && data.length === 0) {
    return <CycleCountsSkeleton />
  }

  // Error state
  if (error) {
    return <CycleCountsError onRetry={refetch} />
  }

  // Empty state
  if (!isLoading && data.length === 0 && filters.status === 'all' && !filters.warehouse_id && !filters.type) {
    return <CycleCountsEmpty onCreateClick={onCreateClick} />
  }

  return (
    <div className="space-y-6" data-testid="cycle-counts-tab">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold">Cycle Counts</h3>
        {onCreateClick && (
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            New Cycle Count
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <CycleCountsSummaryCards
        summary={summary}
        isLoading={isLoading}
        onCardClick={handleSummaryCardClick}
      />

      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-4"
        role="search"
        aria-label="Filter cycle counts"
      >
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ status: value as CycleCountStatus | 'all' })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filter by status">
            <SelectValue placeholder="Status: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type || 'all'}
          onValueChange={(value) => setFilters({ type: value === 'all' ? undefined : value as CycleCountType })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filter by type">
            <SelectValue placeholder="Type: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="cycle">Cycle</SelectItem>
            <SelectItem value="spot">Spot</SelectItem>
          </SelectContent>
        </Select>

        {(filters.status !== 'all' || filters.type || filters.warehouse_id) && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <CycleCountsTable
        data={data}
        isLoading={isLoading}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
        onRowClick={onCountClick}
        onStart={handleStart}
        onContinue={handleContinue}
        onEdit={() => {}} // TODO: Implement edit modal
        onCancel={handleCancel}
        onComplete={handleComplete}
        onViewReport={handleViewReport}
        onExport={handleExport}
      />
    </div>
  )
}
