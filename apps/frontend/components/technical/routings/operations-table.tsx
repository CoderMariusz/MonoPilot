/**
 * Operations Table Component
 * Story: 2.24 Routing Restructure
 * AC-2.24.6: Operations list with labor_cost_per_hour
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
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { RoutingOperation } from '@/lib/services/routing-service'
import { CreateOperationModal } from './create-operation-modal'
import { EditOperationDrawer } from './edit-operation-drawer'

interface OperationsTableProps {
  routingId: string
}

export function OperationsTable({ routingId }: OperationsTableProps) {
  const [operations, setOperations] = useState<RoutingOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOperation, setEditingOperation] = useState<RoutingOperation | null>(null)
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Operations</CardTitle>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Operation
        </Button>
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
                <TableHead>Seq</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Duration (min)</TableHead>
                <TableHead>Labor Cost/hr</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map((operation) => (
                <TableRow key={operation.id}>
                  <TableCell className="font-semibold">{operation.sequence}</TableCell>
                  <TableCell>{operation.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {operation.machine?.name || '—'}
                  </TableCell>
                  <TableCell>
                    {operation.estimated_duration_minutes ?? '—'}
                  </TableCell>
                  <TableCell>
                    {operation.labor_cost_per_hour
                      ? `$${operation.labor_cost_per_hour.toFixed(2)}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingOperation(operation)}
                        title="Edit operation"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(operation)}
                        title="Delete operation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        />
      )}
    </Card>
  )
}
