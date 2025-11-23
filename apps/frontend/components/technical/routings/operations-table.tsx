/**
 * Operations Table Component
 * Story: 2.16 Routing Operations
 * AC-016.2: Operations list with drag-drop reordering
 */

'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { RoutingOperation } from '@/lib/services/routing-service'
import { CreateOperationModal } from './create-operation-modal'
import { EditOperationDrawer } from './edit-operation-drawer'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface OperationsTableProps {
  routingId: string
}

// Sortable Row Component (AC-016.3: Drag-drop)
function SortableRow({ operation, onEdit, onDelete }: {
  operation: RoutingOperation
  onEdit: (op: RoutingOperation) => void
  onDelete: (op: RoutingOperation) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: operation.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[40px]">
        <button {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="font-semibold">{operation.sequence}</TableCell>
      <TableCell>{operation.operation_name}</TableCell>
      <TableCell className="font-mono text-sm">
        {operation.machine?.code || '—'}
      </TableCell>
      <TableCell className="font-mono text-sm">
        {operation.line?.code || '—'}
      </TableCell>
      <TableCell>{operation.expected_duration_minutes} min</TableCell>
      <TableCell>{operation.setup_time_minutes} min</TableCell>
      <TableCell>{operation.expected_yield_percent}%</TableCell>
      <TableCell>
        {operation.labor_cost ? `$${operation.labor_cost.toFixed(2)}` : '—'}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(operation)}
            title="Edit operation"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(operation)}
            title="Delete operation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function OperationsTable({ routingId }: OperationsTableProps) {
  const [operations, setOperations] = useState<RoutingOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOperation, setEditingOperation] = useState<RoutingOperation | null>(null)
  const { toast } = useToast()

  // Drag-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // AC-016.2: Fetch operations
  const fetchOperations = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/technical/routings/${routingId}/operations`)

      if (!response.ok) {
        throw new Error('Failed to fetch operations')
      }

      const data = await response.json()
      setOperations(data.operations || [])
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

  // AC-016.3: Handle drag end (reorder)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = operations.findIndex((op) => op.id === active.id)
    const newIndex = operations.findIndex((op) => op.id === over.id)

    const reorderedOps = arrayMove(operations, oldIndex, newIndex)

    // Update local state immediately for UX
    setOperations(reorderedOps)

    // Recalculate sequences
    const updatedSequences = reorderedOps.map((op, index) => ({
      id: op.id,
      sequence: index + 1,
    }))

    try {
      const response = await fetch(`/api/technical/routings/${routingId}/operations/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: updatedSequences }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder operations')
      }

      toast({
        title: 'Success',
        description: 'Operations reordered successfully',
      })

      // Refresh to get updated data
      fetchOperations()
    } catch (error) {
      console.error('Error reordering operations:', error)
      toast({
        title: 'Error',
        description: 'Failed to reorder operations',
        variant: 'destructive',
      })
      // Revert on error
      fetchOperations()
    }
  }

  // AC-016.5: Delete operation
  const handleDelete = async (operation: RoutingOperation) => {
    if (!confirm(`Delete operation "${operation.operation_name}" (Seq: ${operation.sequence})? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/technical/routings/${routingId}/operations/${operation.id}`, {
        method: 'DELETE',
      })

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

  // AC-016.10: Calculate summary
  const totalDuration = operations.reduce((sum, op) => sum + op.expected_duration_minutes, 0)
  const totalSetup = operations.reduce((sum, op) => sum + op.setup_time_minutes, 0)
  const totalCost = operations.reduce((sum, op) => sum + (op.labor_cost || 0), 0)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Operations ({operations.length})</CardTitle>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Operation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Card (AC-016.10) */}
          {operations.length > 0 && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Total Duration</div>
                <div className="text-2xl font-bold">{totalDuration} min</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Setup Time</div>
                <div className="text-2xl font-bold">{totalSetup} min</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Labor Cost</div>
                <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Operations Table */}
          {loading ? (
            <div className="text-center py-8">Loading operations...</div>
          ) : operations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No operations defined. Add your first operation to get started.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="w-[60px]">Seq</TableHead>
                    <TableHead>Operation Name</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Setup</TableHead>
                    <TableHead>Yield</TableHead>
                    <TableHead>Labor Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={operations.map((op) => op.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {operations.map((operation) => (
                      <SortableRow
                        key={operation.id}
                        operation={operation}
                        onEdit={setEditingOperation}
                        onDelete={handleDelete}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Create Operation Modal (AC-016.1) */}
      <CreateOperationModal
        routingId={routingId}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchOperations()
        }}
      />

      {/* Edit Operation Drawer (AC-016.4) */}
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
        />
      )}
    </>
  )
}
