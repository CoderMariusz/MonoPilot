/**
 * Transfer Order Details Page
 * Story 3.6 & 3.7: Transfer Order CRUD + TO Line Management
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TOLinesTable } from '@/components/planning/TOLinesTable'

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
  from_warehouses?: Warehouse
  to_warehouses?: Warehouse
  created_at: string
  updated_at: string
}

export default function TransferOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [to, setTO] = useState<TransferOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [changingStatus, setChangingStatus] = useState(false)
  const [lineCount, setLineCount] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  // Unwrap params
  useEffect(() => {
    params.then((p) => setParamsId(p.id))
  }, [params])

  // Fetch TO details
  const fetchTO = useCallback(async () => {
    if (!paramsId) return

    try {
      setLoading(true)

      const response = await fetch(`/api/planning/transfer-orders/${paramsId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch transfer order')
      }

      const data = await response.json()
      setTO(data.transfer_order || data)
    } catch (error) {
      console.error('Error fetching transfer order:', error)
      toast({
        title: 'Error',
        description: 'Failed to load transfer order details',
        variant: 'destructive',
      })
      router.push('/planning/transfer-orders')
    } finally {
      setLoading(false)
    }
  }, [paramsId, toast, router])

  useEffect(() => {
    fetchTO()
  }, [fetchTO])

  // Handle line count update (callback from TOLinesTable)
  const handleLinesUpdate = async () => {
    await fetchTO()
  }

  // Handle status change
  const handleStatusChange = async (newStatus: 'planned' | 'cancelled') => {
    if (!to) return

    try {
      setChangingStatus(true)

      const response = await fetch(`/api/planning/transfer-orders/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change status')
      }

      toast({
        title: 'Success',
        description: `Transfer Order ${newStatus === 'planned' ? 'planned' : 'cancelled'} successfully`,
      })

      await fetchTO()
    } catch (error) {
      console.error('Error changing status:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change status',
        variant: 'destructive',
      })
    } finally {
      setChangingStatus(false)
    }
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
      case 'planned':
        return 'default'
      case 'partially_shipped':
        return 'default'
      case 'shipped':
        return 'default'
      case 'partially_received':
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

  if (!to) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Transfer order not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/planning/transfer-orders')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{to.to_number}</h1>
          <Badge variant={getStatusVariant(to.status)}>
            {to.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {to.status === 'draft' && (
            <Button
              onClick={() => handleStatusChange('planned')}
              disabled={changingStatus}
            >
              {changingStatus ? 'Planning...' : 'Plan Transfer Order'}
            </Button>
          )}
          {to.status !== 'cancelled' && to.status !== 'received' && (
            <Button
              variant="destructive"
              onClick={() => handleStatusChange('cancelled')}
              disabled={changingStatus}
            >
              Cancel Transfer
            </Button>
          )}
        </div>
      </div>

      {/* TO Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border rounded-lg p-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Transfer Order Information</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">TO Number:</dt>
              <dd className="font-medium">{to.to_number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">From Warehouse:</dt>
              <dd className="font-medium">
                {to.from_warehouses?.name}
                <div className="text-sm text-gray-500">{to.from_warehouses?.code}</div>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">To Warehouse:</dt>
              <dd className="font-medium">
                {to.to_warehouses?.name}
                <div className="text-sm text-gray-500">{to.to_warehouses?.code}</div>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Status:</dt>
              <dd className="font-medium">{to.status.replace('_', ' ')}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Dates</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Planned Ship Date:</dt>
              <dd className="font-medium">{formatDate(to.planned_ship_date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Planned Receive Date:</dt>
              <dd className="font-medium">{formatDate(to.planned_receive_date)}</dd>
            </div>
            {to.actual_ship_date && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Actual Ship Date:</dt>
                <dd className="font-medium">{formatDate(to.actual_ship_date)}</dd>
              </div>
            )}
            {to.actual_receive_date && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Actual Receive Date:</dt>
                <dd className="font-medium">{formatDate(to.actual_receive_date)}</dd>
              </div>
            )}
          </dl>
          {to.notes && (
            <div className="mt-4">
              <dt className="text-gray-600 mb-1">Notes:</dt>
              <dd className="text-sm">{to.notes}</dd>
            </div>
          )}
        </div>
      </div>

      {/* TO Lines Table */}
      <TOLinesTable
        transferOrderId={params.id}
        toStatus={to.status}
        onLinesUpdate={handleLinesUpdate}
      />
    </div>
  )
}
