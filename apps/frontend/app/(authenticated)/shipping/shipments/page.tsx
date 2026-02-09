/**
 * Shipments List Page
 * Story 07.12: Shipments List & Tracking
 *
 * Main shipments list page with:
 * - DataTable with shipments
 * - Navigation to detail pages
 * - Status filtering
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ShipmentsTable } from './components/PackListTable'

// =============================================================================
// Types
// =============================================================================

interface Shipment {
  id: string
  shipment_number: string
  status: string
  sales_order_id: string
  sales_orders?: {
    id: string
    order_number: string
    status: string
  }
  created_at: string
  updated_at: string
}

// =============================================================================
// Component
// =============================================================================

export default function ShipmentsListPage() {
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fetch shipments on mount
  React.useEffect(() => {
    fetchShipments()
  }, [statusFilter])

  const fetchShipments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const url =
        statusFilter && statusFilter !== 'all'
          ? `/api/shipping/shipments?status=${statusFilter}`
          : '/api/shipping/shipments'

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch shipments')
      }

      const result = await response.json()
      setShipments(result.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load shipments')
      toast({
        title: 'Error',
        description: err.message || 'Failed to load shipments',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handlers
  const handleRowClick = useCallback((id: string) => {
    router.push(`/shipping/shipments/${id}`)
  }, [router])

  const handleRefresh = () => {
    fetchShipments()
  }

  const formattedShipments = shipments.map((shipment) => ({
    id: shipment.id,
    shipment_number: shipment.shipment_number,
    status: shipment.status,
    sales_order_id: shipment.sales_order_id,
    sales_order: shipment.sales_orders
      ? { order_number: shipment.sales_orders.order_number }
      : undefined,
    customer_id: '',
    customer: undefined,
    total_boxes: 0,
    total_weight: null,
    carrier: null,
    tracking_number: null,
    created_at: shipment.created_at,
    packed_at: null,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shipments</h1>
          <p className="text-gray-500">
            View and manage shipments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Shipment
          </Button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['all', 'pending', 'packing', 'packed', 'manifested', 'shipped', 'delivered'].map(
          (status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          )
        )}
      </div>

      {/* Data Table */}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : (
        <ShipmentsTable
          shipments={formattedShipments}
          onRowClick={handleRowClick}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin">
            <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
          </div>
          <p className="mt-2 text-gray-500">Loading shipments...</p>
        </div>
      )}
    </div>
  )
}
