/**
 * TO Lines Table Component
 * Story 3.7: TO Line Management
 *
 * Features:
 * - Display TO lines with product, qty, shipped_qty, received_qty
 * - Add new line button
 * - Edit and delete actions
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TOLineFormModal } from './TOLineFormModal'

interface Product {
  id: string
  code: string
  name: string
  uom: string
}

interface TOLine {
  id: string
  transfer_order_id: string
  product_id: string
  quantity: number
  uom: string
  shipped_qty: number
  received_qty: number
  notes: string | null
  products?: Product
}

interface TOLinesTableProps {
  transferOrderId: string
  toStatus: string
  onLinesUpdate?: () => void
}

export function TOLinesTable({ transferOrderId, toStatus, onLinesUpdate }: TOLinesTableProps) {
  const [lines, setLines] = useState<TOLine[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLine, setSelectedLine] = useState<TOLine | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<TOLine | null>(null)
  const { toast } = useToast()

  // Fetch TO lines
  const fetchLines = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/planning/transfer-orders/${transferOrderId}/lines`)

      if (!response.ok) {
        throw new Error('Failed to fetch TO lines')
      }

      const data = await response.json()
      setLines(data.lines || [])
    } catch (error) {
      console.error('Error fetching TO lines:', error)
      toast({
        title: 'Error',
        description: 'Failed to load TO lines',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLines()
  }, [transferOrderId])

  // Handle delete
  const handleDelete = async () => {
    if (!selectedLine) return

    try {
      const response = await fetch(
        `/api/planning/transfer-orders/${transferOrderId}/lines/${selectedLine.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete TO line')
      }

      toast({
        title: 'Success',
        description: 'TO line deleted successfully',
      })

      await fetchLines()
      onLinesUpdate?.()
    } catch (error) {
      console.error('Error deleting TO line:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete TO line',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedLine(null)
    }
  }

  // Open delete dialog
  const openDeleteDialog = (line: TOLine) => {
    setSelectedLine(line)
    setDeleteDialogOpen(true)
  }

  // Open edit modal
  const openEditModal = (line: TOLine) => {
    setEditingLine(line)
    setFormModalOpen(true)
  }

  // Handle form success
  const handleFormSuccess = async () => {
    setFormModalOpen(false)
    setEditingLine(null)
    await fetchLines()
    onLinesUpdate?.()
  }

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  // Calculate TO Lines Summary (AC-3.7.6)
  const calculateSummary = () => {
    const totalLines = lines.length
    const fullyShipped = lines.filter((line) => line.shipped_qty >= line.quantity).length
    const fullyReceived = lines.filter((line) => line.received_qty >= line.shipped_qty && line.shipped_qty > 0).length

    const shippedPercent = totalLines > 0 ? Math.round((fullyShipped / totalLines) * 100) : 0
    const receivedPercent = totalLines > 0 ? Math.round((fullyReceived / totalLines) * 100) : 0

    return {
      totalLines,
      fullyShipped,
      fullyReceived,
      shippedPercent,
      receivedPercent,
    }
  }

  const summary = calculateSummary()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">TO Lines</h3>
        {toStatus === 'draft' && (
          <Button
            onClick={() => {
              setEditingLine(null)
              setFormModalOpen(true)
            }}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Line
          </Button>
        )}
      </div>

      {/* AC-3.7.6: TO Lines Summary */}
      {lines.length > 0 && (
        <div className="border rounded-lg p-4 grid grid-cols-3 gap-4 bg-gray-50">
          <div>
            <p className="text-sm text-gray-600">Total Lines</p>
            <p className="text-2xl font-bold">{summary.totalLines} {summary.totalLines === 1 ? 'product' : 'products'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Shipped Status</p>
            <p className="text-2xl font-bold">{summary.shippedPercent}%</p>
            <p className="text-xs text-gray-500">
              ({summary.fullyShipped}/{summary.totalLines} products shipped)
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Received Status</p>
            <p className="text-2xl font-bold">{summary.receivedPercent}%</p>
            <p className="text-xs text-gray-500">
              ({summary.fullyReceived}/{summary.totalLines} products received)
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>UoM</TableHead>
              <TableHead className="text-right">Shipped</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No lines added yet
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    {line.products?.name || 'N/A'}
                    <div className="text-sm text-gray-500">{line.products?.code}</div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(line.quantity)}</TableCell>
                  <TableCell>{line.uom}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(line.shipped_qty)} / {formatNumber(line.quantity)} {line.uom}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(line.received_qty)} / {formatNumber(line.quantity)} {line.uom}
                  </TableCell>
                  <TableCell className="text-right">
                    {toStatus === 'draft' && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(line)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(line)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      {formModalOpen && (
        <TOLineFormModal
          open={formModalOpen}
          transferOrderId={transferOrderId}
          onClose={() => {
            setFormModalOpen(false)
            setEditingLine(null)
          }}
          onSuccess={handleFormSuccess}
          line={editingLine}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete TO Line</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this line ({selectedLine?.products?.name})? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedLine(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
