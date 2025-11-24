/**
 * PO Lines Table Component
 * Story 3.2: PO Line Management
 *
 * Features:
 * - Display PO lines with product, qty, price, discount, total
 * - Add new line button
 * - Edit and delete actions
 * - Auto-refresh after line changes
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
import { POLineFormModal } from './POLineFormModal'

interface Product {
  id: string
  code: string
  name: string
  uom: string
}

interface POLine {
  id: string
  sequence: number
  product_id: string
  quantity: number
  uom: string
  unit_price: number
  discount_percent: number
  line_subtotal: number
  discount_amount: number
  line_total: number
  tax_amount: number
  line_total_with_tax: number
  expected_delivery_date: string | null
  products?: Product
}

interface POLinesTa bleProps {
  poId: string
  currency: string
  onTotalsUpdate?: () => void
}

export function POLinesTable({ poId, currency, onTotalsUpdate }: POLinesTableProps) {
  const [lines, setLines] = useState<POLine[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLine, setSelectedLine] = useState<POLine | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<POLine | null>(null)
  const { toast } = useToast()

  // Fetch PO lines
  const fetchLines = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/planning/purchase-orders/${poId}/lines`)

      if (!response.ok) {
        throw new Error('Failed to fetch PO lines')
      }

      const data = await response.json()
      setLines(data.lines || [])
    } catch (error) {
      console.error('Error fetching PO lines:', error)
      toast({
        title: 'Error',
        description: 'Failed to load PO lines',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLines()
  }, [poId])

  // Handle delete
  const handleDelete = async () => {
    if (!selectedLine) return

    try {
      const response = await fetch(
        `/api/planning/purchase-orders/${poId}/lines/${selectedLine.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete PO line')
      }

      toast({
        title: 'Success',
        description: 'PO line deleted successfully',
      })

      // Refresh list
      await fetchLines()
      onTotalsUpdate?.()
    } catch (error) {
      console.error('Error deleting PO line:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete PO line',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedLine(null)
    }
  }

  // Open delete dialog
  const openDeleteDialog = (line: POLine) => {
    setSelectedLine(line)
    setDeleteDialogOpen(true)
  }

  // Open edit modal
  const openEditModal = (line: POLine) => {
    setEditingLine(line)
    setFormModalOpen(true)
  }

  // Handle form success
  const handleFormSuccess = async () => {
    setFormModalOpen(false)
    setEditingLine(null)
    await fetchLines()
    onTotalsUpdate?.()
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(num)
  }

  // Calculate totals
  const totals = lines.reduce(
    (acc, line) => ({
      subtotal: acc.subtotal + line.line_total,
      tax: acc.tax + line.tax_amount,
      total: acc.total + line.line_total_with_tax,
    }),
    { subtotal: 0, tax: 0, total: 0 }
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">PO Lines</h3>
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
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>UoM</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Discount %</TableHead>
              <TableHead className="text-right">Line Total</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  No lines added yet
                </TableCell>
              </TableRow>
            ) : (
              <>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.sequence}</TableCell>
                    <TableCell>
                      {line.products?.name || 'N/A'}
                      <div className="text-sm text-gray-500">
                        {line.products?.code}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(line.quantity)}
                    </TableCell>
                    <TableCell>{line.uom}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.unit_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.discount_percent}%
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.line_total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.tax_amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.line_total_with_tax)}
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={6} className="text-right">
                    Totals:
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.subtotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.tax)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.total)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      {formModalOpen && (
        <POLineFormModal
          open={formModalOpen}
          poId={poId}
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
            <AlertDialogTitle>Delete PO Line</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete line #{selectedLine?.sequence} (
              {selectedLine?.products?.name})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedLine(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
