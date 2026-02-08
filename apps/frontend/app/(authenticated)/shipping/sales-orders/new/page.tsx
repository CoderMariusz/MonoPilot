/**
 * New Sales Order Page
 * Story 07.2: Sales Orders Core
 *
 * Standalone page for creating a new sales order
 * Accessible from dashboard quick actions or direct navigation
 */

'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { SOModal, type Customer, type Product } from '@/components/shipping/sales-orders/SOModal'
import { useCreateSalesOrder } from '@/lib/hooks/use-sales-orders'
import { useState } from 'react'

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
  {
    id: 'cust-003',
    name: 'Tech Solutions Ltd',
    addresses: [
      { id: 'addr-004', label: 'Head Office', address_line1: '100 Tech Park', city: 'Innovation City' },
    ],
  },
]

const mockProducts: Product[] = [
  { id: 'prod-001', code: 'FG-WIDGET-A', name: 'Widget A', std_price: 10.50, available_qty: 150 },
  { id: 'prod-002', code: 'FG-WIDGET-B', name: 'Widget B', std_price: 20.00, available_qty: 75 },
  { id: 'prod-003', code: 'FG-GADGET-C', name: 'Gadget C', std_price: 5.25, available_qty: 500 },
  { id: 'prod-004', code: 'FG-GADGET-D', name: 'Gadget D', std_price: 15.75, available_qty: 200 },
]

// =============================================================================
// Component
// =============================================================================

export default function NewSalesOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(true)
  const createMutation = useCreateSalesOrder()

  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data)
      toast({
        title: 'Success',
        description: 'Sales order created successfully',
      })
      router.push('/shipping/sales-orders')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create sales order',
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleClose = () => {
    setShowModal(false)
    router.push('/shipping/sales-orders')
  }

  const handleBack = () => {
    router.push('/shipping/sales-orders')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sales Orders
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Sales Order</CardTitle>
          <CardDescription>
            Create a new sales order by filling out the form below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the wizard to select a customer, shipping address, add line items, and review your order.
          </p>
        </CardContent>
      </Card>

      {/* Create Modal - Auto opened */}
      <SOModal
        open={showModal}
        onClose={handleClose}
        onSubmit={handleCreate}
        mode="create"
        customers={mockCustomers}
        products={mockProducts}
      />
    </div>
  )
}
