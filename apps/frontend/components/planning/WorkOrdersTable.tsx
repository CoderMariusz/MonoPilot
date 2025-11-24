/**
 * Work Orders Table Component
 * Story 3.10: Work Order CRUD
 * AC-3.10.1: Display work orders with filters, search, and actions
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { WorkOrderFormModal } from './WorkOrderFormModal'

interface Product {
  id: string
  code: string
  name: string
  uom: string
}

interface Machine {
  id: string
  code: string
  name: string
}

interface WorkOrder {
  id: string
  wo_number: string
  product_id: string
  planned_quantity: number
  produced_quantity: number
  uom: string
  status: string
  planned_start_date: string | null
  planned_end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  production_line_id: string | null
  products?: Product
  machines?: Machine
  created_at: string
}

export function WorkOrdersTable() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch work orders
  const fetchWorkOrders = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/planning/work-orders?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch work orders')
      }

      const data = await response.json()
      setWorkOrders(data.work_orders || [])
    } catch (error) {
      console.error('Error fetching work orders:', error)
      toast({
        title: 'Error',
        description: 'Failed to load work orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkOrders()
  }, [search, statusFilter])

  // Handle delete
  const handleDelete = async () => {
    if (!selectedWorkOrder) return

    try {
      const response = await fetch(`/api/planning/work-orders/${selectedWorkOrder.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete work order')
      }

      toast({
        title: 'Success',
        description: 'Work order deleted successfully',
      })

      await fetchWorkOrders()
    } catch (error) {
      console.error('Error deleting work order:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete work order',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedWorkOrder(null)
    }
  }

  // Open delete dialog
  const openDeleteDialog = (wo: WorkOrder, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedWorkOrder(wo)
    setDeleteDialogOpen(true)
  }

  // Open edit modal
  const openEditModal = (wo: WorkOrder, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingWorkOrder(wo)
    setFormModalOpen(true)
  }

  // Handle form success
  const handleFormSuccess = async () => {
    setFormModalOpen(false)
    setEditingWorkOrder(null)
    await fetchWorkOrders()
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'secondary'
      case 'released':
        return 'default'
      case 'in_progress':
        return 'default'
      case 'completed':
        return 'default'
      case 'closed':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  // Format status label
  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Work Orders</h1>
        <Button onClick={() => {
          setEditingWorkOrder(null)
          setFormModalOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Work Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by WO number or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="released">Released</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>WO Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Planned Qty</TableHead>
              <TableHead className="text-right">Produced Qty</TableHead>
              <TableHead>Production Line</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : workOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No work orders found
                </TableCell>
              </TableRow>
            ) : (
              workOrders.map((wo) => (
                <TableRow
                  key={wo.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/planning/work-orders/${wo.id}`)}
                >
                  <TableCell className="font-medium">{wo.wo_number}</TableCell>
                  <TableCell>
                    {wo.products?.name || 'N/A'}
                    <div className="text-sm text-gray-500">{wo.products?.code}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(wo.status)}>
                      {formatStatusLabel(wo.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(wo.planned_quantity)} {wo.uom}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(wo.produced_quantity)} {wo.uom}
                  </TableCell>
                  <TableCell>
                    {wo.machines?.name || '-'}
                    {wo.machines && (
                      <div className="text-sm text-gray-500">{wo.machines.code}</div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(wo.planned_start_date)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => openEditModal(wo, e)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => openDeleteDialog(wo, e)}
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
        <WorkOrderFormModal
          open={formModalOpen}
          onClose={() => {
            setFormModalOpen(false)
            setEditingWorkOrder(null)
          }}
          onSuccess={handleFormSuccess}
          workOrder={editingWorkOrder}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete work order {selectedWorkOrder?.wo_number}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedWorkOrder(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
