'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlayCircle, CheckCircle, CheckCircle2, Clock, Loader2, ListOrdered } from 'lucide-react'
import { OperationStartModal } from './OperationStartModal'
import { OperationCompleteModal } from './OperationCompleteModal'

interface Operation {
  id: string
  sequence: number
  operation_name: string
  status: string
  started_at: string | null
  completed_at: string | null
  expected_duration_minutes: number | null
  actual_duration_minutes: number | null
}

interface WOOperationsPanelProps {
  woId: string
  woNumber: string
  woStatus: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'gray' },
  in_progress: { label: 'In Progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
}

export function WOOperationsPanel({ woId, woNumber, woStatus }: WOOperationsPanelProps) {
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading, setLoading] = useState(true)
  const [sequenceRequired, setSequenceRequired] = useState(false)
  const [startModalOpen, setStartModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null)

  const fetchOperations = async () => {
    try {
      const response = await fetch(`/api/production/work-orders/${woId}/operations`)
      if (response.ok) {
        const { data, sequence_required } = await response.json()
        setOperations(data || [])
        setSequenceRequired(sequence_required ?? false)
      }
    } catch (error) {
      console.error('Failed to fetch operations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOperations()
  }, [woId])

  const canStartOperation = (op: Operation, index: number): boolean => {
    // Can only start if WO is in_progress
    if (woStatus !== 'in_progress') return false

    // Can only start pending operations
    if (op.status !== 'pending') return false

    // If sequence required, check previous operations are completed
    if (sequenceRequired && index > 0) {
      const previousOps = operations.slice(0, index)
      const allPreviousCompleted = previousOps.every((o) => o.status === 'completed')
      if (!allPreviousCompleted) return false
    }

    return true
  }

  const handleStartClick = (op: Operation) => {
    setSelectedOperation(op)
    setStartModalOpen(true)
  }

  const handleCompleteClick = (op: Operation) => {
    setSelectedOperation(op)
    setCompleteModalOpen(true)
  }

  const canCompleteOperation = (op: Operation): boolean => {
    // Can only complete if WO is in_progress or paused
    if (woStatus !== 'in_progress' && woStatus !== 'paused') return false
    // Can only complete in_progress operations
    return op.status === 'in_progress'
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Operations
            {sequenceRequired && (
              <Badge variant="outline" className="ml-2 text-xs">
                Sequence Required
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No operations defined for this work order
            </p>
          ) : (
            <div className="space-y-3">
              {operations.map((op, index) => {
                const config = statusConfig[op.status] || statusConfig.pending
                const canStart = canStartOperation(op, index)

                return (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {op.sequence}
                      </div>
                      <div>
                        <p className="font-medium">{op.operation_name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {op.expected_duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Est: {formatDuration(op.expected_duration_minutes)}
                            </span>
                          )}
                          {op.actual_duration_minutes && (
                            <span className="flex items-center gap-1">
                              Actual: {formatDuration(op.actual_duration_minutes)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant={op.status === 'completed' ? 'default' : 'secondary'}
                        className={
                          config.color === 'blue'
                            ? 'bg-blue-100 text-blue-700'
                            : config.color === 'green'
                              ? 'bg-green-100 text-green-700'
                              : ''
                        }
                      >
                        {op.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {config.label}
                      </Badge>

                      {canStart && (
                        <Button size="sm" onClick={() => handleStartClick(op)} className="gap-1">
                          <PlayCircle className="h-4 w-4" />
                          Start
                        </Button>
                      )}

                      {canCompleteOperation(op) && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteClick(op)}
                          className="gap-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <OperationStartModal
        open={startModalOpen}
        onOpenChange={setStartModalOpen}
        woId={woId}
        woNumber={woNumber}
        operation={selectedOperation}
        onSuccess={fetchOperations}
      />

      <OperationCompleteModal
        open={completeModalOpen}
        onOpenChange={setCompleteModalOpen}
        woId={woId}
        woNumber={woNumber}
        operation={selectedOperation}
        totalOperations={operations.length}
        onSuccess={fetchOperations}
      />
    </>
  )
}
