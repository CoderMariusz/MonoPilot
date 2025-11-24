/**
 * Purchase Order Details Page
 * Story 3.1 & 3.2: Purchase Order CRUD + PO Line Management
 * Display PO header information and PO lines table
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { POLinesTable } from '@/components/planning/POLinesTable'

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
  actual_delivery_date: string | null
  payment_terms: string | null
  shipping_method: string | null
  notes: string | null
  currency: string
  subtotal: number
  tax_amount: number
  total: number
  suppliers?: Supplier
  warehouses?: Warehouse
  created_at: string
  updated_at: string
}

export default function PurchaseOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [po, setPO] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [paramsId, setParamsId] = useState<string>('')
  const router = useRouter()
  const { toast } = useToast()

  // Unwrap params
  useEffect(() => {
    params.then((p) => setParamsId(p.id))
  }, [params])

  // Fetch PO details
  const fetchPO = useCallback(async () => {
    if (!paramsId) return

    try {
      setLoading(true)

      const response = await fetch(`/api/planning/purchase-orders/${paramsId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch purchase order')
      }

      const data = await response.json()
      setPO(data.purchase_order || data)
    } catch (error) {
      console.error('Error fetching purchase order:', error)
      toast({
        title: 'Error',
        description: 'Failed to load purchase order details',
        variant: 'destructive',
      })
      router.push('/planning/purchase-orders')
    } finally {
      setLoading(false)
    }
  }, [paramsId, toast, router])

  useEffect(() => {
    fetchPO()
  }, [fetchPO])

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
      month: 'long',
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!po) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Purchase order not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/planning/purchase-orders')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{po.po_number}</h1>
        <Badge variant={getStatusVariant(po.status)}>{po.status}</Badge>
      </div>

      {/* PO Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border rounded-lg p-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Purchase Order Information</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">PO Number:</dt>
              <dd className="font-medium">{po.po_number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Supplier:</dt>
              <dd className="font-medium">
                {po.suppliers?.name}
                <div className="text-sm text-gray-500">{po.suppliers?.code}</div>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Warehouse:</dt>
              <dd className="font-medium">
                {po.warehouses?.name}
                <div className="text-sm text-gray-500">{po.warehouses?.code}</div>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Currency:</dt>
              <dd className="font-medium">{po.currency}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Expected Delivery:</dt>
              <dd className="font-medium">{formatDate(po.expected_delivery_date)}</dd>
            </div>
            {po.actual_delivery_date && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Actual Delivery:</dt>
                <dd className="font-medium">{formatDate(po.actual_delivery_date)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
          <dl className="space-y-2">
            {po.payment_terms && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Payment Terms:</dt>
                <dd className="font-medium">{po.payment_terms}</dd>
              </div>
            )}
            {po.shipping_method && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Shipping Method:</dt>
                <dd className="font-medium">{po.shipping_method}</dd>
              </div>
            )}
            {po.notes && (
              <div>
                <dt className="text-gray-600 mb-1">Notes:</dt>
                <dd className="text-sm">{po.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* PO Totals Card */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Order Totals</h2>
        <dl className="space-y-2 max-w-md ml-auto">
          <div className="flex justify-between">
            <dt className="text-gray-600">Subtotal:</dt>
            <dd className="font-medium">{formatCurrency(po.subtotal, po.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Tax:</dt>
            <dd className="font-medium">{formatCurrency(po.tax_amount, po.currency)}</dd>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <dt>Total:</dt>
            <dd>{formatCurrency(po.total, po.currency)}</dd>
          </div>
        </dl>
      </div>

      {/* PO Lines Table */}
      <POLinesTable
        poId={paramsId}
        currency={po.currency}
        onTotalsUpdate={fetchPO}
      />
    </div>
  )
}
