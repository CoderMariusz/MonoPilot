/**
 * Operations Table Component
 * Story: 2.24 Routing Restructure, Story 02.8 Routing Operations
 * AC-2.24.6: Operations list with labor_cost_per_hour
 * AC-02: 8 columns (Seq, Name, Machine, Duration, Setup, Yield, Labor Cost, Actions)
 * AC-03, AC-05: Parallel operations indicator "(Parallel)"
 * AC-25, AC-26: Reorder buttons (up/down arrows)
 * AC-30, AC-31: Summary panel with totals
 * AC-32: Permission enforcement (canEdit prop)
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, ChevronDown, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { RoutingOperation } from '@/lib/types/routing-operation'
import type { OperationsSummary } from '@/lib/types/routing-operation'
import { CreateOperationModal } from './create-operation-modal'
import { EditOperationDrawer } from './edit-operation-drawer'

interface OperationsTableProps {
  routingId: string
  /** Whether the user has edit permission. Hides action buttons when false. */
  canEdit?: boolean
}

/**
 * Format duration in minutes to "Xh Ym" format
 */
function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`
  }
  if (hours > 0) {
    return `${hours}h`
  }
  return `${mins}m`
}

/**
 * Check if an operation is part of a parallel group (same sequence as another)
 */
function isParallelOperation(
  operation: RoutingOperation,
  operations: RoutingOperation[]
): boolean {
  return operations.filter(op => op.sequence === operation.sequence).length > 1
}

/**
 * Get unique sequences sorted ascending
 */
function getUniqueSequences(operations: RoutingOperation[]): number[] {
  return [...new Set(operations.map(op => op.sequence))].sort((a, b) => a - b)
}

export function OperationsTable({ routingId, canEdit = true }: OperationsTableProps) {
  const [operations, setOperations] = useState<RoutingOperation[]>([])
  const [summary, setSummary] = useState<OperationsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOperation, setEditingOperation] = useState<RoutingOperation | null>(null)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const { toast } = useToast()

  // Fetch operations
  const fetchOperations = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/technical/routings/${routingId}/operations`)

      if (!response.ok) {
        throw new Error('Failed to fetch operations')
      }

      const data = await response.json()
      setOperations(data.data || [])
      // Set summary from API response if available
      if (data.summary) {
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching operations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load operations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOperations()
  }, [routingId])

  // Delete operation
  const handleDelete = async (operation: RoutingOperation) => {
    if (!confirm(`Delete operation "${operation.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/technical/routings/${routingId}/operations/${operation.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete operation')
      }

      toast({
        title: 'Success',
        description: 'Operation deleted successfully',
      })

      fetchOperations()
    } catch (error) {
      console.error('Error deleting operation:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete operation',
        variant: 'destructive',
      })
    }
  }

  // Reorder operation (AC-25, AC-26)
  const handleReorder = async (opId: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(
        `/api/v1/technical/routings/${routingId}/operations/${opId}/reorder`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ direction }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reorder operation')
      }

      // Refresh without toast for instant feedback
      fetchOperations()
    } catch (error) {
      console.error('Error reordering operation:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reorder operation',
        variant: 'destructive',
      })
    }
  }

  // Calculate which operations can move up/down (AC-26: disable at boundaries)
  const uniqueSequences = useMemo(() => getUniqueSequences(operations), [operations])
  const minSequence = uniqueSequences[0] ?? 0
  const maxSequence = uniqueSequences[uniqueSequences.length - 1] ?? 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Operations</CardTitle>
        {canEdit && (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Operation
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading operations...</div>
        ) : operations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No operations defined. Add the first operation to this routing.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Seq</TableHead>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[150px]">Machine</TableHead>
                <TableHead className="w-[100px]">Duration</TableHead>
                <TableHead className="w-[80px]">Setup</TableHead>
                <TableHead className="w-[80px]">Yield</TableHead>
                <TableHead className="w-[100px]">Labor Cost/hr</TableHead>
                {canEdit && <TableHead className="w-[140px] text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map((operation) => {
                const isParallel = isParallelOperation(operation, operations)
                const canMoveUp = operation.sequence > minSequence
                const canMoveDown = operation.sequence < maxSequence

                return (
                  <TableRow key={operation.id}>
                    <TableCell className="font-semibold">{operation.sequence}</TableCell>
                    <TableCell>
                      {operation.name}
                      {isParallel && (
                        <span className="text-muted-foreground text-sm"> (Parallel)</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {operation.machine_name || '—'}
                    </TableCell>
                    <TableCell>
                      {operation.duration ? `${operation.duration} min` : '—'}
                    </TableCell>
                    <TableCell>
                      {operation.setup_time ? `${operation.setup_time} min` : '0'}
                    </TableCell>
                    <TableCell>
                      {operation.labor_cost_per_hour !== undefined && operation.duration
                        ? '100%'  // Default yield until actual yield tracking
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {operation.labor_cost_per_hour
                        ? `$${operation.labor_cost_per_hour.toFixed(2)}`
                        : '—'}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReorder(operation.id, 'up')}
                            disabled={!canMoveUp}
                            title="Move operation up"
                            aria-label="Move operation up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReorder(operation.id, 'down')}
                            disabled={!canMoveDown}
                            title="Move operation down"
                            aria-label="Move operation down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingOperation(operation)}
                            title="Edit operation"
                            aria-label="Edit operation"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(operation)}
                            title="Delete operation"
                            aria-label="Delete operation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        {/* Summary Panel (AC-30, AC-31) */}
        {operations.length > 0 && summary && (
          <div className="mt-6 border rounded-lg bg-muted/50 p-4">
            <Collapsible open={summaryExpanded} onOpenChange={setSummaryExpanded}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  Cost & Duration Summary
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <span className="mr-2">View Breakdown</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        summaryExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">Total Operations</p>
                  <p className="text-2xl font-bold">{summary.total_operations}</p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">Total Duration</p>
                  <p className="text-2xl font-bold">{formatDuration(summary.total_duration)}</p>
                  <p className="text-xs text-muted-foreground">
                    ({summary.total_duration} min)
                  </p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">Total Labor Cost</p>
                  <p className="text-2xl font-bold">${summary.total_labor_cost.toFixed(2)}</p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">Average Yield</p>
                  <p className="text-2xl font-bold">
                    {summary.average_yield?.toFixed(1) || '100.0'}%
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Weighted by duration
                  </p>
                </div>
              </div>

              {/* Expandable Breakdown */}
              <CollapsibleContent className="mt-4">
                <div className="bg-background rounded-lg p-4 border space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Per-Operation Breakdown
                  </h4>
                  <div className="space-y-2">
                    {operations.map((op) => {
                      const opTime = (op.setup_time || 0) + op.duration + (op.cleanup_time || 0)
                      const opCost = op.labor_cost_per_hour
                        ? (op.duration / 60) * op.labor_cost_per_hour
                        : 0

                      return (
                        <div
                          key={op.id}
                          className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                        >
                          <div>
                            <span className="font-medium">{op.sequence}. {op.name}</span>
                            {isParallelOperation(op, operations) && (
                              <span className="text-muted-foreground ml-1">(Parallel)</span>
                            )}
                          </div>
                          <div className="flex gap-4 text-muted-foreground">
                            <span>{opTime} min</span>
                            <span>
                              (setup: {op.setup_time || 0}, cleanup: {op.cleanup_time || 0})
                            </span>
                            <span className="text-foreground font-medium">
                              ${opCost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>

      {/* Create Operation Modal */}
      <CreateOperationModal
        routingId={routingId}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchOperations()
        }}
        existingSequences={uniqueSequences}
        nextSequence={maxSequence + 1}
      />

      {/* Edit Operation Drawer */}
      {editingOperation && (
        <EditOperationDrawer
          routingId={routingId}
          operation={editingOperation}
          open={!!editingOperation}
          onClose={() => setEditingOperation(null)}
          onSuccess={() => {
            setEditingOperation(null)
            fetchOperations()
          }}
          existingSequences={uniqueSequences}
        />
      )}
    </Card>
  )
}
