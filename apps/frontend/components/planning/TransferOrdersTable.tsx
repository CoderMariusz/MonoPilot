/**
 * Transfer Orders Table Component
 * Story 3.6: Transfer Order CRUD
 *
 * Features:
 * - Display TOs with TO Number, From WH, To WH, Status, Ship Date
 * - Search and filter by status, warehouses, date range
 * - Create new TO button
 * - Edit and delete actions
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Search, Plus, Pencil, Trash2, ChevronDown, ChevronUp, ArrowRight, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getStatusColor } from '@/lib/constants/app-colors'
import { useResponsiveView } from '@/hooks/use-responsive-view'
import { TransferOrderFormModal } from './TransferOrderFormModal'

interface Warehouse {
  id: string
  code: string
  name: string
}

interface TransferOrder {
  id: string
  to_number: string
  from_warehouse_id: string
  to_warehouse_id: string
  status: string
  planned_ship_date: string
  planned_receive_date: string
  actual_ship_date: string | null
  actual_receive_date: string | null
  notes: string | null
  from_warehouse?: Warehouse
  to_warehouse?: Warehouse
}

export function TransferOrdersTable() {
  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTO, setSelectedTO] = useState<TransferOrder | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingTO, setEditingTO] = useState<TransferOrder | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { isMobile } = useResponsiveView()

  // Fetch transfer orders
  const fetchTransferOrders = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/planning/transfer-orders?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch transfer orders')
      }

      const data = await response.json()
      setTransferOrders(data.transfer_orders || [])
    } catch (error) {
      console.error('Error fetching transfer orders:', error)
      toast({
        title: 'Error',
        description: 'Failed to load transfer orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransferOrders()
  }, [statusFilter])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTransferOrders()
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTO) return

    try {
      const response = await fetch(`/api/planning/transfer-orders/${selectedTO.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete transfer order')
      }

      toast({
        title: 'Success',
        description: 'Transfer order deleted successfully',
      })

      // Refresh list
      fetchTransferOrders()
    } catch (error) {
      console.error('Error deleting transfer order:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete transfer order',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedTO(null)
    }
  }

  // Open delete dialog
  const openDeleteDialog = (to: TransferOrder) => {
    setSelectedTO(to)
    setDeleteDialogOpen(true)
  }

  // Open edit modal
  const openEditModal = (to: TransferOrder) => {
    setEditingTO(to)
    setFormModalOpen(true)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transfer Orders</h2>
        <Button
          onClick={() => {
            setEditingTO(null)
            setFormModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Transfer Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by TO number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="partially_shipped">Partially Shipped</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="partially_received">Partially Received</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Card View */}
      {isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : transferOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No transfer orders found</div>
          ) : (
            transferOrders.map((to) => {
              const isExpanded = expandedCard === to.id
              return (
                <div
                  key={to.id}
                  className="border rounded-lg bg-white shadow-sm overflow-hidden"
                >
                  {/* Card Header - Always visible */}
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedCard(isExpanded ? null : to.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-semibold text-gray-900">{to.to_number}</span>
                      <Badge className={getStatusColor(to.status)}>
                        {to.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="truncate">
                        {to.from_warehouse?.code || 'N/A'}
                      </span>
                      <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {to.to_warehouse?.code || 'N/A'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 ml-2" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 ml-2" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      isExpanded ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <div className="px-4 pb-4 space-y-3 border-t bg-gray-50">
                      <div className="grid grid-cols-2 gap-3 pt-3 text-sm">
                        <div>
                          <span className="text-gray-500">From:</span>
                          <p className="font-medium">{to.from_warehouse?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">To:</span>
                          <p className="font-medium">{to.to_warehouse?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Ship Date:</span>
                          <p className="font-medium">{formatDate(to.planned_ship_date)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Receive Date:</span>
                          <p className="font-medium">{formatDate(to.planned_receive_date)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/planning/transfer-orders/${to.id}`)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(to)
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteDialog(to)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TO Number</TableHead>
                <TableHead>From Warehouse</TableHead>
                <TableHead>To Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Planned Ship Date</TableHead>
                <TableHead>Planned Receive Date</TableHead>
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
              ) : transferOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No transfer orders found
                  </TableCell>
                </TableRow>
              ) : (
                transferOrders.map((to) => (
                  <TableRow
                    key={to.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/planning/transfer-orders/${to.id}`)}
                  >
                    <TableCell className="font-medium">{to.to_number}</TableCell>
                    <TableCell>
                      {to.from_warehouse?.name || 'N/A'}
                      <div className="text-sm text-gray-500">
                        {to.from_warehouse?.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      {to.to_warehouse?.name || 'N/A'}
                      <div className="text-sm text-gray-500">
                        {to.to_warehouse?.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(to.status)}>
                        {to.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(to.planned_ship_date)}</TableCell>
                    <TableCell>{formatDate(to.planned_receive_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(to)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteDialog(to)
                          }}
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
      )}

      {/* Form Modal */}
      {formModalOpen && (
        <TransferOrderFormModal
          open={formModalOpen}
          onClose={() => {
            setFormModalOpen(false)
            setEditingTO(null)
          }}
          onSuccess={() => {
            setFormModalOpen(false)
            setEditingTO(null)
            fetchTransferOrders()
          }}
          transferOrder={editingTO}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transfer Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete TO {selectedTO?.to_number}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTO(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
