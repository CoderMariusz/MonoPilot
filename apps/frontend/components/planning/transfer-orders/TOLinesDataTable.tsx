/**
 * TO Lines Data Table Component
 * Story 03.8: Transfer Orders CRUD + Lines
 * Displays transfer order line items with actions
 */

'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { AddLineModal } from './AddLineModal'
import { DeleteLineDialog } from './DeleteLineDialog'
import { useDeleteTOLine } from '@/lib/hooks/use-transfer-order-mutations'
import type { TransferOrderLineWithProduct, TOStatus } from '@/lib/types/transfer-order'
import { canModifyLines } from '@/lib/types/transfer-order'
import { useToast } from '@/hooks/use-toast'

interface TOLinesDataTableProps {
  toId: string
  lines: TransferOrderLineWithProduct[]
  status: TOStatus
  loading?: boolean
  onRefresh?: () => void
  canEdit?: boolean
}

export function TOLinesDataTable({
  toId,
  lines,
  status,
  loading,
  onRefresh,
  canEdit = true,
}: TOLinesDataTableProps) {
  const [addLineOpen, setAddLineOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<TransferOrderLineWithProduct | null>(null)
  const [deletingLine, setDeletingLine] = useState<TransferOrderLineWithProduct | null>(null)

  const deleteLineMutation = useDeleteTOLine()
  const { toast } = useToast()
  const isEditable = canModifyLines(status) && canEdit

  // Get existing product IDs to prevent duplicates
  const existingProductIds = lines.map((line) => line.product_id)

  // Calculate summary
  const summary = {
    totalLines: lines.length,
    totalRequested: lines.reduce((sum, line) => sum + line.quantity, 0),
    totalShipped: lines.reduce((sum, line) => sum + (line.shipped_qty || 0), 0),
    totalReceived: lines.reduce((sum, line) => sum + (line.received_qty || 0), 0),
  }

  const shippedPercent = summary.totalRequested > 0
    ? Math.round((summary.totalShipped / summary.totalRequested) * 100)
    : 0

  // Format number
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingLine) return

    try {
      await deleteLineMutation.mutateAsync({
        toId,
        lineId: deletingLine.id,
      })
      toast({ title: 'Success', description: 'Line deleted successfully' })
      setDeletingLine(null)
      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete line',
        variant: 'destructive',
      })
    }
  }

  // Get line status display
  const getLineStatus = (line: TransferOrderLineWithProduct) => {
    const percent = line.quantity > 0
      ? Math.round((line.shipped_qty / line.quantity) * 100)
      : 0

    if (percent === 0) return { label: '0%', color: 'text-gray-500', bg: 'bg-gray-100' }
    if (percent >= 100) return { label: '100%', color: 'text-green-700', bg: 'bg-green-100' }
    return { label: `${percent}%`, color: 'text-yellow-700', bg: 'bg-yellow-100' }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Line Items</h3>
        {isEditable && (
          <Button size="sm" onClick={() => setAddLineOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Line
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {lines.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">Total Lines</p>
            <p className="text-xl font-bold">{summary.totalLines}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Requested Qty</p>
            <p className="text-xl font-bold">{formatNumber(summary.totalRequested)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Shipped Qty</p>
            <p className="text-xl font-bold">{formatNumber(summary.totalShipped)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Progress</p>
            <div className="flex items-center gap-2">
              <Progress value={shippedPercent} className="flex-1 h-2" />
              <span className="text-sm font-medium">{shippedPercent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Requested</TableHead>
              <TableHead className="text-right">Shipped</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-center">Status</TableHead>
              {isEditable && <TableHead className="w-24"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isEditable ? 7 : 6} className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Package className="h-10 w-10 text-gray-400 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      No Line Items
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Add products to transfer between warehouses.
                    </p>
                    {isEditable && (
                      <Button size="sm" onClick={() => setAddLineOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Line
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line, index) => {
                const lineStatus = getLineStatus(line)
                return (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium text-gray-500">
                      {line.line_number || index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{line.product?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{line.product?.code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(line.quantity)} {line.uom}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(line.shipped_qty || 0)} {line.uom}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(line.received_qty || 0)} {line.uom}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${lineStatus.bg} ${lineStatus.color}`}
                      >
                        {lineStatus.label}
                      </span>
                    </TableCell>
                    {isEditable && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLine(line)}
                            aria-label="Edit line"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingLine(line)}
                            aria-label="Delete line"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Line Modal */}
      <AddLineModal
        open={addLineOpen}
        onClose={() => setAddLineOpen(false)}
        toId={toId}
        existingProductIds={existingProductIds}
        onSuccess={onRefresh}
      />

      {/* Edit Line Modal */}
      {editingLine && (
        <AddLineModal
          open={!!editingLine}
          onClose={() => setEditingLine(null)}
          toId={toId}
          existingProductIds={existingProductIds}
          line={editingLine}
          onSuccess={onRefresh}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingLine && (
        <DeleteLineDialog
          open={!!deletingLine}
          onClose={() => setDeletingLine(null)}
          lineNumber={deletingLine.line_number || 1}
          productName={deletingLine.product?.name || 'Unknown'}
          quantity={deletingLine.quantity}
          uom={deletingLine.uom}
          onConfirm={handleDeleteConfirm}
          isLoading={deleteLineMutation.isPending}
        />
      )}
    </div>
  )
}

export default TOLinesDataTable
