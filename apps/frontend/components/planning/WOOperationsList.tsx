/**
 * WO Operations List Component
 * Story 3.14: Routing Copy to WO
 * Displays list of operations for a Work Order
 */

'use client'

import { useState, useEffect } from 'react'
import { Loader2, Cog, AlertTriangle, Clock, CheckCircle, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OperationStartModal } from '@/components/production/OperationStartModal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Machine {
  id: string
  code: string
  name: string
}

interface WOOperation {
  id: string
  wo_id: string
  sequence: number
  operation_name: string
  machine_id: string | null
  line_id: string | null
  expected_duration_minutes: number | null
  expected_yield_percent: number | null
  status: string
  started_at: string | null
  completed_at: string | null
  actual_duration_minutes: number | null
  machines?: Machine | null
}

interface WOOperationsListProps {
  woId: string
  woStatus: string
}

export function WOOperationsList({ woId, woStatus }: WOOperationsListProps) {
  const [operations, setOperations] = useState<WOOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sequenceRequired, setSequenceRequired] = useState(false)
  const [startModalOpen, setStartModalOpen] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<WOOperation | null>(null)
  const [woNumber, setWoNumber] = useState('')

  useEffect(() => {
    async function fetchOperations() {
      try {
        setLoading(true)
        setError(null)

        // Try production API first (Story 4.4), fallback to planning API
        let response = await fetch(`/api/production/work-orders/${woId}/operations`)

        if (!response.ok) {
          // Fallback to planning API
          response = await fetch(`/api/planning/work-orders/${woId}/operations`)
        }

        if (!response.ok) {
          throw new Error('Failed to fetch operations')
        }

        const data = await response.json()
        setOperations(data.data || [])
        setSequenceRequired(data.sequence_required ?? false)
        setWoNumber(data.wo_number || '')
      } catch (err) {
        console.error('Error fetching operations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load operations')
      } finally {
        setLoading(false)
      }
    }

    if (woId) {
      fetchOperations()
    }
  }, [woId])

  // Check if operation can be started (Story 4.4)
  const canStartOperation = (op: WOOperation, index: number): boolean => {
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

  const handleStartClick = (op: WOOperation) => {
    setSelectedOperation(op)
    setStartModalOpen(true)
  }

  const fetchOperations = async () => {
    try {
      let response = await fetch(`/api/production/work-orders/${woId}/operations`)
      if (!response.ok) {
        response = await fetch(`/api/planning/work-orders/${woId}/operations`)
      }
      if (response.ok) {
        const data = await response.json()
        setOperations(data.data || [])
        setSequenceRequired(data.sequence_required ?? false)
      }
    } catch {
      // silent
    }
  }

  // Format duration
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="outline" className="text-gray-600">Not Started</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
      case 'skipped':
        return <Badge variant="outline" className="text-gray-400">Skipped</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading operations...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertTriangle className="h-6 w-6 mr-2" />
        <span>{error}</span>
      </div>
    )
  }

  if (operations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Cog className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No operations found for this work order.</p>
        <p className="text-sm mt-1">Operations are copied from routing when the work order is created.</p>
      </div>
    )
  }

  // Calculate progress
  const completedCount = operations.filter(op => op.status === 'completed').length
  const totalCount = operations.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {operations.length} operation{operations.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            Progress: {completedCount}/{totalCount}
          </div>
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium">{progressPercent}%</span>
        </div>
      </div>

      {/* Operations Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>Machine</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="text-right">Yield %</TableHead>
              <TableHead className="text-center">Status</TableHead>
              {woStatus === 'in_progress' && <TableHead className="text-center">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.map((operation, index) => (
              <TableRow key={operation.id}>
                <TableCell className="text-gray-500 font-mono">
                  {operation.sequence}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{operation.operation_name}</div>
                </TableCell>
                <TableCell>
                  {operation.machines ? (
                    <div>
                      <span className="font-medium">{operation.machines.code}</span>
                      <span className="text-gray-500 text-sm ml-1">
                        - {operation.machines.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not assigned</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="font-mono">
                      {formatDuration(operation.expected_duration_minutes)}
                    </span>
                  </div>
                  {operation.actual_duration_minutes && (
                    <div className="text-xs text-gray-500">
                      Actual: {formatDuration(operation.actual_duration_minutes)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {operation.expected_yield_percent
                    ? `${operation.expected_yield_percent}%`
                    : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(operation.status)}
                </TableCell>
                {woStatus === 'in_progress' && (
                  <TableCell className="text-center">
                    {canStartOperation(operation, index) ? (
                      <Button
                        size="sm"
                        onClick={() => handleStartClick(operation)}
                        className="gap-1"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Start
                      </Button>
                    ) : operation.status === 'in_progress' ? (
                      <span className="text-blue-600 text-sm">Running</span>
                    ) : operation.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Total Duration */}
      <div className="text-sm text-gray-500">
        <span>Total expected duration: </span>
        <span className="font-medium">
          {formatDuration(
            operations.reduce((sum, op) => sum + (op.expected_duration_minutes || 0), 0)
          )}
        </span>
      </div>

      {/* Start Operation Modal - Story 4.4 */}
      <OperationStartModal
        open={startModalOpen}
        onOpenChange={setStartModalOpen}
        woId={woId}
        woNumber={woNumber}
        operation={selectedOperation}
        onSuccess={fetchOperations}
      />
    </div>
  )
}
