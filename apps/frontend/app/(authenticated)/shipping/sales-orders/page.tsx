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

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
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
import { useCustomers } from '@/lib/hooks/use-customers'

// =============================================================================
// Types for API responses
// =============================================================================

interface CustomerAddress {
  id: string
  label: string
  address_line1: string
  city: string
}

interface ProductFromAPI {
  id: string
  code: string
  name: string
  std_price: number | null
}

// =============================================================================
// Component
// =============================================================================

// =============================================================================
// Hooks for fetching customers with addresses and products
// =============================================================================

function useCustomersWithAddresses() {
  const { data: customersResponse, isLoading: customersLoading } = useCustomers({ limit: 100, is_active: true })
  
  // Fetch addresses for all customers
  const customerIds = customersResponse?.data?.map((c: any) => c.id) || []
  
  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['customer-addresses', customerIds],
    queryFn: async () => {
      if (customerIds.length === 0) return {}
      
      // Fetch addresses for each customer in parallel
      const addressPromises = customerIds.map(async (customerId: string) => {
        const res = await fetch(`/api/shipping/customers/${customerId}/addresses`)
        if (!res.ok) return { customerId, addresses: [] }
        const addresses = await res.json()
        return { customerId, addresses }
      })
      
      const results = await Promise.all(addressPromises)
      const addressMap: Record<string, CustomerAddress[]> = {}
      results.forEach(({ customerId, addresses }) => {
        addressMap[customerId] = addresses
      })
      return addressMap
    },
    enabled: customerIds.length > 0,
    staleTime: 60000,
  })
  
  const customers: Customer[] = useMemo(() => {
    if (!customersResponse?.data) return []
    
    return customersResponse.data.map((c: any) => ({
      id: c.id,
      name: c.name,
      addresses: (addressesData?.[c.id] || []).map((addr: any) => ({
        id: addr.id,
        label: addr.label || addr.address_type || 'Address',
        address_line1: addr.address_line1 || addr.street || '',
        city: addr.city || '',
      })),
    }))
  }, [customersResponse?.data, addressesData])
  
  return {
    customers,
    isLoading: customersLoading || addressesLoading,
  }
}

function useProductsForSO() {
  return useQuery({
    queryKey: ['products-for-so'],
    queryFn: async (): Promise<Product[]> => {
      // Fetch finished goods products (FG type) for sales orders
      const res = await fetch('/api/technical/products?limit=200&status=active')
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      
      return (data.data || []).map((p: ProductFromAPI) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        std_price: p.std_price ?? 0,
        available_qty: 0, // TODO: integrate with inventory when available
      }))
    },
    staleTime: 60000,
  })
}

export default function SalesOrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  // Open create modal if action=create in URL (BUG-011 fix)
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowCreateModal(true)
      // Clean up URL
      router.replace('/shipping/sales-orders', { scroll: false })
    }
  }, [searchParams, router])

  // Fetch real customers with addresses and products
  const { customers, isLoading: customersLoading } = useCustomersWithAddresses()
  const { data: products = [], isLoading: productsLoading } = useProductsForSO()

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
        customers={customers}
        products={products}
        isLoading={customersLoading || productsLoading}
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
