/**
 * Availability Summary Card Component - Story 03.13
 *
 * Header card displaying overall availability status with
 * summary counts (Total, Sufficient, Low Stock, Shortage).
 *
 * @module components/planning/work-orders/availability/AvailabilitySummaryCard
 */

'use client'

import { RefreshCw, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { AvailabilitySummary, OverallStatus, MaterialAvailability } from '@/lib/types/wo-availability'
import { getStatusLabel } from '@/lib/types/wo-availability'
import { AvailabilityTrafficLight } from './AvailabilityTrafficLight'

export interface AvailabilitySummaryCardProps {
  summary: AvailabilitySummary
  overallStatus: OverallStatus
  checkedAt: string
  cached?: boolean
  cacheExpiresAt?: string
  onRefresh?: () => void
  isRefreshing?: boolean
  criticalMaterials?: MaterialAvailability[]
  className?: string
}

interface StatCardProps {
  label: string
  count: number
  status?: 'sufficient' | 'low_stock' | 'shortage'
}

function StatCard({ label, count, status }: StatCardProps) {
  return (
    <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-lg min-w-[80px]">
      <div className="flex items-center gap-1.5 mb-1">
        {status && (
          <AvailabilityTrafficLight
            status={status === 'shortage' ? 'shortage' : status}
            size="sm"
            showTooltip={false}
          />
        )}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-2xl font-bold tabular-nums">{count}</span>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-10" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Format time since last check
 */
function formatTimeSince(checkedAt: string): string {
  const now = new Date()
  const checked = new Date(checkedAt)
  const diffMs = now.getTime() - checked.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} hr ago`
  return checked.toLocaleDateString()
}

/**
 * Get overall status message
 */
function getOverallMessage(status: OverallStatus, summary: AvailabilitySummary): string {
  switch (status) {
    case 'sufficient':
      return 'All materials available'
    case 'low_stock':
      return `${summary.low_stock_count} material${summary.low_stock_count > 1 ? 's' : ''} below 100%`
    case 'shortage':
    case 'no_stock':
      return `${summary.shortage_count} material${summary.shortage_count > 1 ? 's' : ''} with critical shortage`
    default:
      return ''
  }
}

/**
 * Get status icon
 */
function StatusIcon({ status }: { status: OverallStatus }) {
  switch (status) {
    case 'sufficient':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'low_stock':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case 'shortage':
    case 'no_stock':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    default:
      return null
  }
}

/**
 * Summary card showing overall availability status
 *
 * Displays:
 * - Overall status indicator
 * - Last checked timestamp
 * - Refresh button
 * - Summary counts (Total, Sufficient, Low Stock, Shortage)
 * - Critical warnings if shortages present
 *
 * @param summary - Availability summary counts
 * @param overallStatus - Worst-case status
 * @param checkedAt - ISO timestamp of last check
 * @param cached - Whether data is from cache
 * @param cacheExpiresAt - When cache expires
 * @param onRefresh - Refresh callback
 * @param isRefreshing - Loading state for refresh
 * @param criticalMaterials - Materials with shortage status
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <AvailabilitySummaryCard
 *   summary={data.summary}
 *   overallStatus={data.overall_status}
 *   checkedAt={data.checked_at}
 *   cached={data.cached}
 *   onRefresh={refetch}
 *   isRefreshing={isFetching}
 * />
 * ```
 */
export function AvailabilitySummaryCard({
  summary,
  overallStatus,
  checkedAt,
  cached = false,
  cacheExpiresAt,
  onRefresh,
  isRefreshing = false,
  criticalMaterials = [],
  className,
}: AvailabilitySummaryCardProps) {
  const statusLabel = getStatusLabel(overallStatus)
  const statusMessage = getOverallMessage(overallStatus, summary)
  const timeSince = formatTimeSince(checkedAt)

  const statusBgColor = {
    sufficient: 'bg-green-100',
    low_stock: 'bg-yellow-100',
    shortage: 'bg-red-100',
    no_stock: 'bg-red-100',
  }[overallStatus]

  const statusTextColor = {
    sufficient: 'text-green-800',
    low_stock: 'text-yellow-800',
    shortage: 'text-red-800',
    no_stock: 'text-red-800',
  }[overallStatus]

  return (
    <Card className={cn('w-full', className)} data-testid="availability-summary-card">
      <CardContent className="p-4 space-y-4">
        {/* Header Row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AvailabilityTrafficLight
              status={overallStatus}
              size="md"
              showTooltip={false}
            />
            <span className="font-semibold">Material Availability</span>
            {cached && (
              <Badge variant="secondary" className="text-xs">
                Cached
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Last checked: {timeSince}</span>
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Refresh availability check"
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Materials" count={summary.total_materials} />
          <StatCard label="Sufficient" count={summary.sufficient_count} status="sufficient" />
          <StatCard label="Low Stock" count={summary.low_stock_count} status="low_stock" />
          <StatCard label="Shortage" count={summary.shortage_count} status="shortage" />
        </div>

        {/* Overall Status Banner */}
        <div className={cn('flex items-center gap-2 p-3 rounded-lg', statusBgColor)}>
          <StatusIcon status={overallStatus} />
          <span className={cn('font-medium', statusTextColor)}>
            Overall Status: {statusLabel.toUpperCase()}
          </span>
          <span className={cn('text-sm', statusTextColor)}>
            - {statusMessage}
          </span>
        </div>

        {/* Critical Warnings */}
        {criticalMaterials.length > 0 && (
          <div className="space-y-2">
            {criticalMaterials.slice(0, 3).map((mat) => (
              <div
                key={mat.product_id}
                className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-2 rounded"
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  {mat.status === 'no_stock' ? 'Critical: ' : 'Warning: '}
                  {mat.product_name} has {Math.round(mat.coverage_percent)}% coverage
                  {mat.shortage_qty > 0 && ` (${mat.shortage_qty.toFixed(0)} ${mat.uom} shortage)`}
                </span>
              </div>
            ))}
            {criticalMaterials.length > 3 && (
              <p className="text-sm text-red-600 pl-6">
                +{criticalMaterials.length - 3} more materials with issues
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Loading skeleton for summary card
 */
AvailabilitySummaryCard.Skeleton = LoadingSkeleton

export default AvailabilitySummaryCard
