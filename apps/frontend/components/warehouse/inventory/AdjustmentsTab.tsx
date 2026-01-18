/**
 * Adjustments Tab Component
 * Wireframe: WH-INV-001 - Adjustments Tab (Screen 6)
 * PRD: FR-024 (Stock Adjustment)
 */

'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, AlertTriangle, RefreshCw, ClipboardList } from 'lucide-react'
import { AdjustmentsSummaryCards } from './AdjustmentsSummaryCards'
import { AdjustmentsTable } from './AdjustmentsTable'
import { ApproveAdjustmentDialog } from './ApproveAdjustmentDialog'
import { RejectAdjustmentDialog } from './RejectAdjustmentDialog'
import { useAdjustments } from '@/hooks/warehouse/useAdjustments'
import type { Adjustment, AdjustmentStatus, AdjustmentReasonCode } from '@/lib/types/adjustment'

interface AdjustmentsTabProps {
  onCreateClick?: () => void
  onAdjustmentClick?: (adjustment: Adjustment) => void
  onViewLP?: (lpId: string) => void
  userRoles?: string[]
}

// Loading skeleton
function AdjustmentsSkeleton() {
  return (
    <div className="space-y-6" data-testid="adjustments-skeleton">
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
function AdjustmentsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      data-testid="adjustments-error"
      role="alert"
    >
      <div className="rounded-full bg-red-100 p-6 mb-4">
        <AlertTriangle className="h-12 w-12 text-red-600" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to Load Adjustments</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Unable to retrieve adjustment data. Please check your connection and try again.
      </p>
      <Button onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  )
}

// Empty state
function AdjustmentsEmpty({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      data-testid="adjustments-empty"
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <ClipboardList className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Adjustments Yet</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        No stock adjustments have been recorded. Adjustments are created when
        inventory discrepancies are found during cycle counts or manual corrections.
      </p>
      {onCreateClick && (
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          New Adjustment
        </Button>
      )}
      <div className="mt-8 text-sm text-muted-foreground max-w-md text-left">
        <p className="font-medium mb-2">Common Adjustment Reasons:</p>
        <ul className="space-y-1">
          <li>Damage - Physical damage to goods</li>
          <li>Counting Error - Cycle count discrepancies</li>
          <li>Expired - Product past expiry date</li>
          <li>Quality Issue - Failed QA inspection</li>
        </ul>
      </div>
    </div>
  )
}

/**
 * Check if user can approve adjustments based on roles
 */
function canApproveAdjustments(roles?: string[]): boolean {
  if (!roles) return false
  return roles.includes('warehouse_manager') || roles.includes('admin')
}

export function AdjustmentsTab({
  onCreateClick,
  onAdjustmentClick,
  onViewLP,
  userRoles,
}: AdjustmentsTabProps) {
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
    approveAdjustment,
    rejectAdjustment,
    isApproving,
    isRejecting,
  } = useAdjustments()

  // Dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedAdjustment, setSelectedAdjustment] = useState<Adjustment | null>(null)

  // Permissions
  const canApprove = useMemo(() => canApproveAdjustments(userRoles), [userRoles])

  // Handle summary card click
  const handleSummaryCardClick = (type: 'total' | 'increased' | 'decreased' | 'pending') => {
    switch (type) {
      case 'total':
        clearFilters()
        break
      case 'pending':
        setFilters({ status: 'pending' })
        break
      // For increased/decreased, we could add a filter but it requires API support
      default:
        clearFilters()
    }
  }

  // Handle approve
  const handleApproveClick = (adjustment: Adjustment) => {
    setSelectedAdjustment(adjustment)
    setApproveDialogOpen(true)
  }

  const handleApproveConfirm = () => {
    if (selectedAdjustment) {
      approveAdjustment(selectedAdjustment.id)
      setApproveDialogOpen(false)
      setSelectedAdjustment(null)
    }
  }

  // Handle reject
  const handleRejectClick = (adjustment: Adjustment) => {
    setSelectedAdjustment(adjustment)
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = (reason: string) => {
    if (selectedAdjustment) {
      rejectAdjustment({ id: selectedAdjustment.id, reason })
      setRejectDialogOpen(false)
      setSelectedAdjustment(null)
    }
  }

  // Handle view LP
  const handleViewLP = (adjustment: Adjustment) => {
    onViewLP?.(adjustment.lp_id)
  }

  // Loading state
  if (isLoading && data.length === 0) {
    return <AdjustmentsSkeleton />
  }

  // Error state
  if (error) {
    return <AdjustmentsError onRetry={refetch} />
  }

  // Empty state
  if (!isLoading && data.length === 0 && filters.status === 'all' && !filters.reason && !filters.adjusted_by) {
    return <AdjustmentsEmpty onCreateClick={onCreateClick} />
  }

  return (
    <div className="space-y-6" data-testid="adjustments-tab">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold">Stock Adjustments</h3>
        {onCreateClick && (
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            New Adjustment
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <AdjustmentsSummaryCards
        summary={summary}
        isLoading={isLoading}
        onCardClick={handleSummaryCardClick}
      />

      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row gap-4"
        role="search"
        aria-label="Filter adjustments"
      >
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ status: value as AdjustmentStatus | 'all' })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filter by status">
            <SelectValue placeholder="Status: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.reason || 'all'}
          onValueChange={(value) => setFilters({ reason: value === 'all' ? undefined : value as AdjustmentReasonCode })}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filter by reason">
            <SelectValue placeholder="Reason: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            <SelectItem value="damage">Damage</SelectItem>
            <SelectItem value="theft">Theft</SelectItem>
            <SelectItem value="counting_error">Counting Error</SelectItem>
            <SelectItem value="quality_issue">Quality Issue</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {(filters.status !== 'all' || filters.reason || filters.adjusted_by) && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <AdjustmentsTable
        data={data}
        isLoading={isLoading}
        pagination={pagination}
        page={page}
        canApprove={canApprove}
        onPageChange={setPage}
        onRowClick={onAdjustmentClick}
        onApprove={handleApproveClick}
        onReject={handleRejectClick}
        onViewLP={handleViewLP}
      />

      {/* Approve Dialog */}
      <ApproveAdjustmentDialog
        open={approveDialogOpen}
        adjustment={selectedAdjustment}
        isApproving={isApproving}
        onConfirm={handleApproveConfirm}
        onCancel={() => {
          setApproveDialogOpen(false)
          setSelectedAdjustment(null)
        }}
      />

      {/* Reject Dialog */}
      <RejectAdjustmentDialog
        open={rejectDialogOpen}
        adjustment={selectedAdjustment}
        isRejecting={isRejecting}
        onConfirm={handleRejectConfirm}
        onCancel={() => {
          setRejectDialogOpen(false)
          setSelectedAdjustment(null)
        }}
      />
    </div>
  )
}
