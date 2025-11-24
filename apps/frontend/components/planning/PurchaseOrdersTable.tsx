/**
 * Purchase Orders Table Component
 * Story 3.1: Purchase Order CRUD
 *
 * Features:
 * - Display POs with PO Number, Supplier, Status, Expected Date, Total
 * - Search and filter by status, supplier, warehouse, date range
 * - Create new PO button
 * - Edit and delete actions
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal'

interface Supplier {
  id: string
  code: string
  name: string
  currency: string
}

interface Warehouse {
  id: string
  code: string
  name: string
}

interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  warehouse_id: string
  status: string
  expected_delivery_date: string
  total: number
  currency: string
  suppliers?: Supplier
  warehouses?: Warehouse
}

export function PurchaseOrdersTable() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const { toast } = useToast()

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/planning/purchase-orders?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch purchase orders')
      }

      const data = await response.json()
      setPurchaseOrders(data.purchase_orders || [])
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      toast({
        title: 'Error',
        description: 'Failed to load purchase orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchaseOrders()
  }, [statusFilter])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPurchaseOrders()
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedPO) return

    try {
      const response = await fetch(`/api/planning/purchase-orders/${selectedPO.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete purchase order')
      }

      toast({
        title: 'Success',
        description: 'Purchase order deleted successfully',
      })

      // Refresh list
      fetchPurchaseOrders()
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete purchase order',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedPO(null)
    }
  }

  // Open delete dialog
  const openDeleteDialog = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setDeleteDialogOpen(true)
  }

  // Open edit modal
  const openEditModal = (po: PurchaseOrder) => {
    setEditingPO(po)
    setFormModalOpen(true)
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'secondary'
      case 'submitted':
        return 'default'
      case 'confirmed':
        return 'default'
      case 'received':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        <Button onClick={() => {
          setEditingPO(null)
          setFormModalOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Purchase Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by PO number or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expected Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No purchase orders found
                </TableCell>
              </TableRow>
            ) : (
              purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.po_number}</TableCell>
                  <TableCell>
                    {po.suppliers?.name || 'N/A'}
                    <div className="text-sm text-gray-500">
                      {po.suppliers?.code}
                    </div>
                  </TableCell>
                  <TableCell>
                    {po.warehouses?.name || 'N/A'}
                    <div className="text-sm text-gray-500">
                      {po.warehouses?.code}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(po.status)}>
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(po.expected_delivery_date)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(po.total, po.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(po)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(po)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      {formModalOpen && (
        <PurchaseOrderFormModal
          open={formModalOpen}
          onClose={() => {
            setFormModalOpen(false)
            setEditingPO(null)
          }}
          onSuccess={() => {
            setFormModalOpen(false)
            setEditingPO(null)
            fetchPurchaseOrders()
          }}
          purchaseOrder={editingPO}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete PO {selectedPO?.po_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPO(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
