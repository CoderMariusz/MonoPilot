/**
 * Sales Orders List Page
 * Story 07.2: Sales Orders Core
 *
 * Main sales orders list page with:
 * - DataTable with search, filters, pagination
 * - Create/Edit modal
 * - Delete confirmation
 * - Status actions (Confirm)
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { SODataTable } from '@/components/shipping/sales-orders/SODataTable'
import { SOModal, type Customer, type Product } from '@/components/shipping/sales-orders/SOModal'
import {
  useSalesOrders,
  useCreateSalesOrder,
  useDeleteSalesOrder,
  useConfirmSalesOrder,
  type SalesOrderListParams,
} from '@/lib/hooks/use-sales-orders'

// =============================================================================
// Mock Data (Replace with real API calls)
// =============================================================================

const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'Acme Corporation',
    addresses: [
      { id: 'addr-001', label: 'Main Office', address_line1: '123 Main St', city: 'Springfield' },
      { id: 'addr-002', label: 'Warehouse', address_line1: '456 Industrial Ave', city: 'Springfield' },
    ],
  },
  {
    id: 'cust-002',
    name: 'Best Foods Inc',
    addresses: [
      { id: 'addr-003', label: 'Headquarters', address_line1: '789 Business Blvd', city: 'Shelbyville' },
    ],
  },
]

const mockProducts: Product[] = [
  { id: 'prod-001', code: 'FG-WIDGET-A', name: 'Widget A', std_price: 10.50, available_qty: 150 },
  { id: 'prod-002', code: 'FG-WIDGET-B', name: 'Widget B', std_price: 20.00, available_qty: 75 },
  { id: 'prod-003', code: 'FG-GADGET-C', name: 'Gadget C', std_price: 5.25, available_qty: 500 },
]

// =============================================================================
// Component
// =============================================================================

export default function SalesOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [params, setParams] = useState<SalesOrderListParams>({
    page: 1,
    limit: 25,
    sort: 'order_date',
    order: 'desc',
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null)

  // Queries and Mutations
  const { data, isLoading, error } = useSalesOrders(params)
  const createMutation = useCreateSalesOrder()
  const deleteMutation = useDeleteSalesOrder()
  const confirmMutation = useConfirmSalesOrder()

  // Handlers
  const handleSearch = useCallback((term: string) => {
    setParams((prev) => ({ ...prev, search: term, page: 1 }))
  }, [])

  const handleStatusFilter = useCallback((status: string) => {
    setParams((prev) => ({
      ...prev,
      status: status ? (status as any) : undefined,
      page: 1,
    }))
  }, [])

  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setParams((prev) => ({ ...prev, sort: field, order }))
  }, [])

  const handleView = useCallback((id: string) => {
    router.push(`/shipping/sales-orders/${id}`)
  }, [router])

  const handleEdit = useCallback((id: string) => {
    router.push(`/shipping/sales-orders/${id}/edit`)
  }, [router])

  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data)
      toast({
        title: 'Success',
        description: 'Sales order created successfully',
      })
      setShowCreateModal(false)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create sales order',
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleDelete = async () => {
    if (!deleteOrderId) return

    try {
      await deleteMutation.mutateAsync(deleteOrderId)
      toast({
        title: 'Success',
        description: 'Sales order deleted',
      })
      setDeleteOrderId(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete sales order',
        variant: 'destructive',
      })
    }
  }

  const handleConfirm = async () => {
    if (!confirmOrderId) return

    try {
      await confirmMutation.mutateAsync(confirmOrderId)
      toast({
        title: 'Success',
        description: 'Sales order confirmed and locked',
      })
      setConfirmOrderId(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to confirm sales order',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Orders</h1>
          <p className="text-gray-500">
            Manage customer orders and track fulfillment
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Sales Order
        </Button>
      </div>

      {/* Data Table */}
      <SODataTable
        data={data?.data || []}
        loading={isLoading}
        error={error?.message || null}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setDeleteOrderId}
        onConfirm={setConfirmOrderId}
        onCreate={() => setShowCreateModal(true)}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        sortField={params.sort}
        sortOrder={params.order}
        onSortChange={handleSortChange}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
      />

      {/* Create Modal */}
      <SOModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        mode="create"
        customers={mockCustomers}
        products={mockProducts}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order and all its lines will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Confirmation */}
      <AlertDialog open={!!confirmOrderId} onOpenChange={() => setConfirmOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sales Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Once confirmed, this order will be locked and cannot be edited.
              Proceed with confirmation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
