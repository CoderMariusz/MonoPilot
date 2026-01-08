'use client'

/**
 * YieldSection Component
 * Story: 04.4 - Yield Tracking
 *
 * Container component for all yield tracking UI elements.
 * Orchestrates YieldWarningBanner, YieldGauge, YieldEntryForm, and YieldHistoryTable.
 *
 * States:
 * - Loading: Show skeleton components while fetching data
 * - Editable: WO status is 'in_progress', form enabled
 * - Disabled: WO status is 'draft' or 'released', form disabled with message
 * - Read-Only: WO status is 'completed' or 'cancelled', form hidden
 * - Error: API failure, show error with retry
 */

import { useState, useEffect, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { YieldGauge, getYieldStatus, YieldGaugeSkeleton } from './YieldGauge'
import { YieldWarningBanner } from './YieldWarningBanner'
import { YieldEntryForm, YieldEntryFormSkeleton, type YieldUpdateResult } from './YieldEntryForm'
import { YieldHistoryTable, YieldHistoryTableSkeleton, type YieldLogEntry } from './YieldHistoryTable'
import { cn } from '@/lib/utils'
import type { WOStatus } from '@/lib/validation/production-schemas'

export type { WOStatus }

export interface YieldSectionProps {
  /** Work Order ID */
  woId: string
  /** Planned production quantity */
  plannedQuantity: number
  /** Current produced quantity */
  producedQuantity: number
  /** Current WO status */
  woStatus: WOStatus
  /** Unit of measure */
  uom?: string
  /** Whether overproduction is allowed (from settings) */
  allowOverproduction?: boolean
  /** Callback when yield is updated */
  onYieldUpdate?: (result: YieldUpdateResult) => void
  /** Callback to start WO */
  onStartWO?: () => void
}

/**
 * Calculate yield percentage
 */
function calculateYieldPercent(produced: number, planned: number): number {
  if (planned === 0) return 0
  return Math.round((produced / planned) * 1000) / 10
}

/**
 * Loading skeleton for entire YieldSection
 */
function YieldSectionSkeleton() {
  return (
    <div className="space-y-4">
      <YieldGaugeSkeleton />
      <YieldEntryFormSkeleton />
      <YieldHistoryTableSkeleton />
    </div>
  )
}

/**
 * Error state with retry
 */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-destructive/5">
      <AlertCircle className="h-12 w-12 text-destructive mb-3" />
      <h3 className="font-medium text-lg mb-1">Failed to Load Yield Data</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}

/**
 * Read-only message for completed WOs
 */
function ReadOnlyMessage({
  yieldPercent,
  completedAt,
  completedBy,
}: {
  yieldPercent: number
  completedAt?: string
  completedBy?: string
}) {
  const formattedDate = completedAt
    ? new Date(completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : undefined

  return (
    <div className="border rounded-lg p-4 bg-muted/50 text-sm">
      <p>
        Work order completed. Final yield: <strong>{yieldPercent.toFixed(1)}%</strong>
      </p>
      {formattedDate && (
        <p className="text-muted-foreground mt-1">
          Completed on: {formattedDate}
          {completedBy && ` by ${completedBy}`}
        </p>
      )}
    </div>
  )
}

export function YieldSection({
  woId,
  plannedQuantity,
  producedQuantity: initialProducedQuantity,
  woStatus,
  uom = 'units',
  allowOverproduction = true,
  onYieldUpdate,
  onStartWO,
}: YieldSectionProps) {
  const [producedQuantity, setProducedQuantity] = useState(initialProducedQuantity)
  const [yieldHistory, setYieldHistory] = useState<YieldLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate current yield
  const yieldPercent = calculateYieldPercent(producedQuantity, plannedQuantity)
  const yieldStatus = getYieldStatus(yieldPercent)

  // Determine section state based on WO status
  const isEditable = woStatus === 'in_progress' || woStatus === 'paused'
  const isDisabled = woStatus === 'draft' || woStatus === 'released'
  const isReadOnly = woStatus === 'completed' || woStatus === 'cancelled'

  // Fetch yield history
  const fetchYieldHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/production/work-orders/${woId}/yield/history`)
      if (!response.ok) {
        throw new Error('Failed to load yield history')
      }
      const result = await response.json()
      const logsData = result.data?.logs || []
      setYieldHistory(
        logsData.map((log: {
          id: string
          created_at: string
          user_name?: string
          old_quantity: number
          new_quantity: number
          old_yield_percent: number
          new_yield_percent: number
          notes?: string | null
        }) => ({
          id: log.id,
          timestamp: log.created_at,
          user_name: log.user_name || 'Unknown',
          old_quantity: log.old_quantity,
          new_quantity: log.new_quantity,
          old_yield_percent: log.old_yield_percent,
          new_yield_percent: log.new_yield_percent,
          notes: log.notes,
        }))
      )
    } catch (err) {
      console.error('Failed to fetch yield history:', err)
      // Don't set error for history - it's not critical
    }
  }, [woId])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        await fetchYieldHistory()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load yield data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fetchYieldHistory])

  // Update produced quantity when prop changes
  useEffect(() => {
    setProducedQuantity(initialProducedQuantity)
  }, [initialProducedQuantity])

  // Handle successful yield update
  const handleYieldUpdate = async (result: YieldUpdateResult) => {
    setProducedQuantity(result.produced_quantity)
    await fetchYieldHistory() // Refresh history
    onYieldUpdate?.(result)
  }

  // Handle retry
  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    fetchYieldHistory().finally(() => setIsLoading(false))
  }

  if (isLoading) {
    return <YieldSectionSkeleton />
  }

  if (error) {
    return <ErrorState message={error} onRetry={handleRetry} />
  }

  return (
    <div className="space-y-4">
      {/* Warning Banner - shown when yield < 80% and WO is in progress */}
      {isEditable && yieldPercent < 80 && yieldPercent > 0 && (
        <YieldWarningBanner yieldPercent={yieldPercent} />
      )}

      {/* Yield Gauge - always shown */}
      <YieldGauge
        yieldPercent={yieldPercent}
        status={yieldStatus}
        plannedQuantity={plannedQuantity}
        producedQuantity={producedQuantity}
        uom={uom}
        isCompleted={isReadOnly}
      />

      {/* Entry Form - shown when editable, disabled message when not started */}
      {isEditable && (
        <YieldEntryForm
          woId={woId}
          currentProducedQuantity={producedQuantity}
          plannedQuantity={plannedQuantity}
          uom={uom}
          allowOverproduction={allowOverproduction}
          onSuccess={handleYieldUpdate}
        />
      )}

      {isDisabled && (
        <YieldEntryForm
          woId={woId}
          currentProducedQuantity={producedQuantity}
          plannedQuantity={plannedQuantity}
          uom={uom}
          disabled
          onSuccess={handleYieldUpdate}
        />
      )}

      {/* Read-only message for completed WOs */}
      {isReadOnly && <ReadOnlyMessage yieldPercent={yieldPercent} />}

      {/* History Table - always shown (handles its own empty state) */}
      <YieldHistoryTable woId={woId} uom={uom} data={yieldHistory} onRetry={fetchYieldHistory} />
    </div>
  )
}

export default YieldSection
