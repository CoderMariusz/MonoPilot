/**
 * ASN Items Table Component
 * Epic 5 Batch 5A-3 - Story 5.9: ASN Item Management
 * AC-5.9.3: Display items with status badges
 * AC-5.9.4: Edit/Delete actions (only if not received)
 */

'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/hooks/use-toast'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { ASNItemFormModal } from './ASNItemFormModal'

interface ASNItem {
  id: string
  po_line_id: string
  product_id: string
  expected_qty: number
  received_qty: number
  uom: string
  supplier_batch_number: string | null
  manufacture_date: string | null
  expiry_date: string | null
  products: {
    code: string
    name: string
  }
}

interface ASNItemsTableProps {
  asnId: string
  poId: string
  isDraft: boolean
}

export function ASNItemsTable({ asnId, poId, isDraft }: ASNItemsTableProps) {
  const [items, setItems] = useState<ASNItem[]>([])
  const [loading, setLoading] = useState(true)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ASNItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch items
  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/warehouse/asns/${asnId}/items`)

      if (!response.ok) {
        throw new Error('Failed to fetch ASN items')
      }

      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error fetching ASN items:', error)
      toast({
        title: 'Error',
        description: 'Failed to load ASN items',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [asnId])

  // Handle add item
  const handleAddItem = () => {
    setSelectedItem(null)
    setFormModalOpen(true)
  }

  // Handle edit item
  const handleEditItem = (item: ASNItem) => {
    setSelectedItem(item)
    setFormModalOpen(true)
  }

  // Handle delete item
  const handleDeleteItem = (itemId: string) => {
    setItemToDelete(itemId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`/api/warehouse/asns/${asnId}/items/${itemToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      })

      fetchItems()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Get item status
  const getItemStatus = (item: ASNItem) => {
    if (item.received_qty === 0) return 'pending'
    if (item.received_qty < item.expected_qty) return 'partial'
    return 'received'
  }

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800 border-gray-300',
    partial: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    received: 'bg-green-100 text-green-800 border-green-300',
  }

  const statusLabels = {
    pending: 'Pending',
    partial: 'Partial',
    received: 'Received',
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading items...</div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Add Item Button */}
        {isDraft && (
          <div className="flex justify-end">
            <Button onClick={handleAddItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        )}

        {/* Items Table */}
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            No items in this ASN
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Code</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead className="text-right">Expected Qty</TableHead>
            <TableHead className="text-right">Received Qty</TableHead>
            <TableHead>UoM</TableHead>
            <TableHead>Batch Number</TableHead>
            <TableHead>Mfg Date</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            {isDraft && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const status = getItemStatus(item)

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.products.code}</TableCell>
                <TableCell>{item.products.name}</TableCell>
                <TableCell className="text-right">{item.expected_qty}</TableCell>
                <TableCell className="text-right">
                  {item.received_qty > 0 ? (
                    <span className="font-medium text-green-600">{item.received_qty}</span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{item.uom}</TableCell>
                <TableCell>{item.supplier_batch_number || '-'}</TableCell>
                <TableCell>
                  {item.manufacture_date
                    ? new Date(item.manufacture_date).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>
                  {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[status]}>
                    {statusLabels[status]}
                  </Badge>
                </TableCell>
                {isDraft && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        disabled={item.received_qty > 0}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={item.received_qty > 0}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <ASNItemFormModal
        open={formModalOpen}
        asnId={asnId}
        poId={poId}
        onClose={() => {
          setFormModalOpen(false)
          setSelectedItem(null)
        }}
        onSuccess={fetchItems}
        item={selectedItem}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ASN Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
