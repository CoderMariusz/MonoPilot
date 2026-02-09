/**
 * Shipment Detail Page
 * Story 07.12: Shipments List & Tracking
 *
 * Detailed view for a single shipment with:
 * - Shipment information
 * - Tracking timeline
 * - Box list and contents
 * - Action buttons (track, cancel, update status)
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ShipmentActions } from './components/ShipmentActions'
import { TrackingDialog } from './components/TrackingDialog'
import { TrackingTimeline } from './components/TrackingTimeline'
import { PackListTable } from '../components/PackListTable'

// =============================================================================
// Types
// =============================================================================

interface Shipment {
  id: string
  shipment_number: string
  status: string
  sales_order_id: string
  ship_to_address_id: string | null
  ship_from_address_id: string | null
  special_instructions: string | null
  created_at: string
  updated_at: string
  packed_at: string | null
  manifested_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  sales_orders?: {
    id: string
    order_number: string
    status: string
    customer_id: string
    customers?: {
      id: string
      name: string
      email: string
    }
  }
  shipment_boxes?: {
    id: string
    box_number: number
    weight: number | null
    length: number | null
    width: number | null
    height: number | null
    sscc: string | null
    tracking_number: string | null
    created_at: string
  }[]
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  packing: 'bg-blue-100 text-blue-800',
  packed: 'bg-green-100 text-green-800',
  manifested: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  exception: 'bg-red-100 text-red-800',
}

// =============================================================================
// Component
// =============================================================================

export default function ShipmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const shipmentId = params.id as string

  // State
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [showTrackingDialog, setShowTrackingDialog] = useState(false)

  // Fetch shipment on mount
  React.useEffect(() => {
    if (shipmentId) {
      fetchShipment()
    }
  }, [shipmentId])

  const fetchShipment = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/shipping/shipments/${shipmentId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Shipment not found')
        }
        throw new Error('Failed to fetch shipment')
      }

      const result = await response.json()
      setShipment(result.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load shipment')
      toast({
        title: 'Error',
        description: err.message || 'Failed to load shipment',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handlers
  const handleManifest = async (id: string) => {
    try {
      setIsActionLoading(true)
      const response = await fetch(`/api/shipping/shipments/${id}/manifest`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to manifest shipment')
      }

      toast({
        title: 'Success',
        description: 'Shipment manifested successfully',
      })
      fetchShipment()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to manifest shipment',
        variant: 'destructive',
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleShip = async (id: string) => {
    try {
      setIsActionLoading(true)
      const response = await fetch(`/api/shipping/shipments/${id}/ship`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to ship shipment')
      }

      toast({
        title: 'Success',
        description: 'Shipment shipped successfully',
      })
      fetchShipment()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to ship shipment',
        variant: 'destructive',
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleMarkDelivered = async (id: string) => {
    try {
      setIsActionLoading(true)
      const response = await fetch(`/api/shipping/shipments/${id}/mark-delivered`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to mark shipment as delivered')
      }

      toast({
        title: 'Success',
        description: 'Shipment marked as delivered',
      })
      fetchShipment()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to mark shipment as delivered',
        variant: 'destructive',
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleViewTracking = () => {
    setShowTrackingDialog(true)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
          </div>
          <p className="text-gray-500">Loading shipment details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !shipment) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error || 'Shipment not found'}</p>
        </div>
      </div>
    )
  }

  const customer = shipment.sales_orders?.customers
  const boxes = shipment.shipment_boxes || []

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{shipment.shipment_number}</h1>
          <p className="text-gray-500">
            SO #{shipment.sales_orders?.order_number} • {customer?.name || 'Unknown Customer'}
          </p>
        </div>
        <Badge
          className={`text-base px-4 py-2 capitalize ${
            statusColors[shipment.status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {shipment.status}
        </Badge>
      </div>

      {/* Shipment Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Card */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold mb-4">Shipment Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Shipment ID:</span>
              <span className="font-mono">{shipment.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{formatDate(shipment.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Boxes:</span>
              <span>{boxes.length}</span>
            </div>
            {shipment.special_instructions && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-gray-600">Special Instructions:</span>
                <p className="text-gray-800 mt-2">{shipment.special_instructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Card */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold mb-4">Timeline</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600">Packed:</span>
              <p className="font-medium">{formatDate(shipment.packed_at)}</p>
            </div>
            <div>
              <span className="text-gray-600">Manifested:</span>
              <p className="font-medium">{formatDate(shipment.manifested_at)}</p>
            </div>
            <div>
              <span className="text-gray-600">Shipped:</span>
              <p className="font-medium">{formatDate(shipment.shipped_at)}</p>
            </div>
            <div>
              <span className="text-gray-600">Delivered:</span>
              <p className="font-medium">{formatDate(shipment.delivered_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      {customer && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold mb-4">Customer</h3>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-gray-900">{customer.name}</p>
            <p className="text-gray-600">{customer.email}</p>
          </div>
        </div>
      )}

      {/* Tracking Timeline */}
      {shipment.status === 'shipped' || shipment.status === 'delivered' ? (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold mb-4">Tracking Timeline</h3>
          <TrackingTimeline shipmentId={shipment.id} />
        </div>
      ) : null}

      {/* Boxes */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="font-semibold mb-4">Boxes ({boxes.length})</h3>
        <PackListTable
          boxes={boxes.map((box) => ({
            ...box,
            contents: [],
          }))}
          isEditable={false}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4">
        <ShipmentActions
          shipment={{
            id: shipment.id,
            shipment_number: shipment.shipment_number,
            status: shipment.status as any,
            customer_name: customer?.name || 'Unknown',
            packed_at: shipment.packed_at,
            manifested_at: shipment.manifested_at,
            shipped_at: shipment.shipped_at,
            delivered_at: shipment.delivered_at,
          }}
          onManifest={handleManifest}
          onShip={handleShip}
          onMarkDelivered={handleMarkDelivered}
          onViewTracking={handleViewTracking}
          userRole="Admin"
          isLoading={isActionLoading}
        />
      </div>

      {/* Tracking Dialog */}
      <TrackingDialog
        open={showTrackingDialog}
        onOpenChange={setShowTrackingDialog}
        shipmentId={shipment.id}
        shipmentNumber={shipment.shipment_number}
      />
    </div>
  )
}
