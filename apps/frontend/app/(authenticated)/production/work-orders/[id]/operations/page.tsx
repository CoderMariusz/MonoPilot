'use client'

/**
 * Work Order Operations Page
 * Story: 04.3 - Operation Start/Complete
 *
 * Displays operations timeline and execution controls for a work order.
 * Includes all 4 states: loading, error, empty, success.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  ListOrdered,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import {
  OperationsTimeline,
  OperationCard,
  CompleteOperationModal,
  SequenceWarning,
  type OperationStatus,
} from '@/components/production/operations'
import { OperationStartModal } from '@/components/production/OperationStartModal'

interface Operation {
  id: string
  sequence: number
  operation_name: string
  status: OperationStatus
  started_at: string | null
  completed_at: string | null
  expected_duration_minutes: number | null
  actual_duration_minutes: number | null
  actual_yield_percent: number | null
  started_by_user?: {
    first_name: string | null
    last_name: string | null
  } | null
  completed_by_user?: {
    first_name: string | null
    last_name: string | null
  } | null
}

interface WorkOrder {
  id: string
  wo_number: string
  status: string
  product_name?: string
  planned_quantity?: number
}

/**
 * Loading skeleton for the page
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Timeline skeleton */}
      <Skeleton className="h-48 w-full rounded-lg" />

      {/* Operations list skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
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
  error: string
  onRetry: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load operations</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}

export default function OperationsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const woId = params.id as string

  // State
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [operations, setOperations] = useState<Operation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sequenceRequired, setSequenceRequired] = useState(false)

  // Modal state
  const [startModalOpen, setStartModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(
    null
  )
  const [sequenceWarning, setSequenceWarning] = useState<{
    blocked: Operation
    blocking: Operation[]
  } | null>(null)

  // Fetch operations
  const fetchOperations = useCallback(async () => {
    setError(null)

    try {
      // Fetch WO info
      const woResponse = await fetch(`/api/production/work-orders/${woId}`)
      if (!woResponse.ok) {
        if (woResponse.status === 404) {
          throw new Error('Work order not found')
        }
        throw new Error('Failed to fetch work order')
      }
      const woData = await woResponse.json()
      setWorkOrder(woData.data)

      // Fetch operations
      const opsResponse = await fetch(
        `/api/production/work-orders/${woId}/operations`
      )
      if (!opsResponse.ok) {
        throw new Error('Failed to fetch operations')
      }
      const opsData = await opsResponse.json()
      setOperations(opsData.data || [])
      setSequenceRequired(opsData.sequence_required ?? false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [woId])

  useEffect(() => {
    fetchOperations()
  }, [fetchOperations])

  // Check if operation can be started (sequence logic)
  const canStartOperation = (op: Operation, index: number): boolean => {
    if (!workOrder) return false
    if (workOrder.status !== 'in_progress' && workOrder.status !== 'paused')
      return false
    if (op.status !== 'pending') return false

    if (sequenceRequired && index > 0) {
      const previousOps = operations.slice(0, index)
      const allPreviousCompleted = previousOps.every(
        (o) => o.status === 'completed' || o.status === 'skipped'
      )
      return allPreviousCompleted
    }

    return true
  }

  // Get blocking operations for sequence warning
  const getBlockingOperations = (index: number): Operation[] => {
    if (!sequenceRequired || index === 0) return []
    return operations
      .slice(0, index)
      .filter((o) => o.status !== 'completed' && o.status !== 'skipped')
  }

  // Check if operation can be completed
  const canCompleteOperation = (op: Operation): boolean => {
    if (!workOrder) return false
    if (workOrder.status !== 'in_progress' && workOrder.status !== 'paused')
      return false
    return op.status === 'in_progress'
  }

  // Handle start click
  const handleStartClick = (op: Operation, index: number) => {
    if (!canStartOperation(op, index)) {
      // Show sequence warning
      const blocking = getBlockingOperations(index)
      if (blocking.length > 0) {
        setSequenceWarning({ blocked: op, blocking })
      }
      return
    }

    setSelectedOperation(op)
    setStartModalOpen(true)
  }

  // Handle complete click
  const handleCompleteClick = (op: Operation) => {
    setSelectedOperation(op)
    setCompleteModalOpen(true)
  }

  // Handle complete operation API call
  const handleCompleteOperation = async (input: {
    actual_yield_percent: number
    notes?: string
  }) => {
    if (!selectedOperation) return

    const response = await fetch(
      `/api/production/work-orders/${woId}/operations/${selectedOperation.id}/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Failed to complete operation')
    }

    // Refresh operations
    await fetchOperations()
  }

  // Handle operation start success
  const handleStartSuccess = () => {
    fetchOperations()
  }

  // Handle back navigation
  const handleBack = () => {
    router.push(`/production/work-orders/${woId}`)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <LoadingSkeleton />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Work Order
          </Button>
        </div>
        <ErrorState error={error} onRetry={fetchOperations} />
      </div>
    )
  }

  // Success state
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold">
            Operations - {workOrder?.wo_number}
          </h1>
          {workOrder?.product_name && (
            <p className="text-muted-foreground">{workOrder.product_name}</p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={fetchOperations}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Sequence Warning Alert */}
      {sequenceWarning && (
        <SequenceWarning
          blockedOperation={sequenceWarning.blocked}
          blockingOperations={sequenceWarning.blocking}
          onDismiss={() => setSequenceWarning(null)}
        />
      )}

      {/* Operations Timeline */}
      <OperationsTimeline
        operations={operations}
        isLoading={isLoading}
        error={error}
        onRetry={fetchOperations}
        sequenceRequired={sequenceRequired}
        onOperationSelect={(op) => {
          setSelectedOperation(op as Operation)
        }}
      />

      {/* Operations List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Operations
            {sequenceRequired && (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                (Sequence Required)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No operations defined for this work order
            </p>
          ) : (
            <div className="space-y-3">
              {operations.map((op, index) => {
                const canStart = canStartOperation(op, index)
                const canComplete = canCompleteOperation(op)
                const blocking = getBlockingOperations(index)
                const isBlocked = !canStart && op.status === 'pending' && blocking.length > 0

                return (
                  <OperationCard
                    key={op.id}
                    operation={op}
                    canStart={canStart}
                    canComplete={canComplete}
                    onStart={() => handleStartClick(op, index)}
                    onComplete={() => handleCompleteClick(op)}
                    sequenceBlocked={isBlocked}
                    sequenceBlockReason={
                      isBlocked
                        ? `Complete ${blocking[0].operation_name} first`
                        : undefined
                    }
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Modal */}
      <OperationStartModal
        open={startModalOpen}
        onOpenChange={setStartModalOpen}
        woId={woId}
        woNumber={workOrder?.wo_number || ''}
        operation={selectedOperation}
        onSuccess={handleStartSuccess}
      />

      {/* Complete Modal */}
      <CompleteOperationModal
        open={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        operation={selectedOperation}
        woId={woId}
        woNumber={workOrder?.wo_number || ''}
        totalOperations={operations.length}
        onComplete={handleCompleteOperation}
      />
    </div>
  )
}
