/**
 * GRN Detail Page
 * Epic 5 Batch 5A-3 - Story 5.11: GRN with LP Creation
 * AC-5.11.3: View GRN details with items and receive actions
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { GRNItemsTable } from '@/components/warehouse/GRNItemsTable'
import { format } from 'date-fns'

interface GRN {
  id: string
  grn_number: string
  status: string
  received_at: string | null
  received_by: string | null
  notes: string | null
  asn: {
    id: string
    asn_number: string
  } | null
  purchase_orders: {
    id: string
    po_number: string
  } | null
  warehouses: {
    code: string
    name: string
  }
  locations: {
    code: string
    name: string | null
  } | null
  created_at: string
  updated_at: string
  grn_items: Array<{
    id: string
    expected_qty: number
    received_qty: number
  }>
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

const STATUS_LABELS = {
  draft: 'Draft',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function GRNDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [grn, setGRN] = useState<GRN | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  const grnId = params.id as string

  // Fetch GRN details
  const fetchGRN = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/warehouse/grns/${grnId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch GRN')
      }

      const data = await response.json()
      setGRN(data.grn)
    } catch (error) {
      console.error('Error fetching GRN:', error)
      toast({
        title: 'Error',
        description: 'Failed to load GRN details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGRN()
  }, [grnId])

  const handleCompleteGRN = async () => {
    if (!grn) return

    // Validate that all items have received_qty > 0
    const allItemsReceived = grn.grn_items.every(item => item.received_qty > 0)
    if (!allItemsReceived) {
      toast({
        title: 'Cannot complete',
        description: 'All items must have received quantity greater than 0',
        variant: 'destructive',
      })
      return
    }

    setCompleting(true)

    try {
      const response = await fetch(`/api/warehouse/grns/${grnId}/complete`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete GRN')
      }

      toast({
        title: 'Success',
        description: 'GRN completed successfully',
      })

      fetchGRN()
    } catch (error) {
      console.error('Error completing GRN:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete GRN',
        variant: 'destructive',
      })
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="text-center py-8 text-muted-foreground">Loading GRN details...</div>
      </div>
    )
  }

  if (!grn) {
    return (
      <div className="px-6 py-6">
        <div className="text-center py-8 text-muted-foreground">GRN not found</div>
      </div>
    )
  }

  const allItemsReceived = grn.grn_items.every(item => item.received_qty > 0)
  const canComplete = grn.status === 'in_progress' && allItemsReceived

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/warehouse/receiving')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{grn.grn_number}</h1>
            <p className="text-sm text-muted-foreground">Goods Receipt Note</p>
          </div>
          <Badge variant="outline" className={STATUS_COLORS[grn.status as keyof typeof STATUS_COLORS]}>
            {STATUS_LABELS[grn.status as keyof typeof STATUS_LABELS]}
          </Badge>
        </div>

        <div className="flex gap-2">
          {canComplete && (
            <Button onClick={handleCompleteGRN} disabled={completing}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {completing ? 'Completing...' : 'Complete GRN'}
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Info */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">GRN Number:</div>
              <div className="font-medium">{grn.grn_number}</div>

              <div className="text-muted-foreground">ASN Number:</div>
              <div>
                {grn.asn ? (
                  <button
                    onClick={() => router.push(`/warehouse/asns/${grn.asn!.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    {grn.asn.asn_number}
                  </button>
                ) : (
                  '-'
                )}
              </div>

              <div className="text-muted-foreground">PO Number:</div>
              <div>
                {grn.purchase_orders ? (
                  <button
                    onClick={() => router.push(`/planning/purchase-orders/${grn.purchase_orders?.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    {grn.purchase_orders.po_number}
                  </button>
                ) : (
                  '-'
                )}
              </div>

              <div className="text-muted-foreground">Warehouse:</div>
              <div>
                {grn.warehouses.code} - {grn.warehouses.name}
              </div>

              <div className="text-muted-foreground">Receiving Location:</div>
              <div>
                {grn.locations
                  ? `${grn.locations.code}${grn.locations.name ? ` - ${grn.locations.name}` : ''}`
                  : '-'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receiving Details */}
        <Card>
          <CardHeader>
            <CardTitle>Receiving Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Received Date:</div>
              <div>
                {grn.received_at
                  ? format(new Date(grn.received_at), 'MMM dd, yyyy HH:mm')
                  : '-'}
              </div>

              <div className="text-muted-foreground">Created:</div>
              <div>{format(new Date(grn.created_at), 'MMM dd, yyyy HH:mm')}</div>

              <div className="text-muted-foreground">Last Updated:</div>
              <div>{format(new Date(grn.updated_at), 'MMM dd, yyyy HH:mm')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {grn.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{grn.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items to Receive</CardTitle>
          <CardDescription>
            {allItemsReceived
              ? 'All items have been received'
              : 'Click "Receive" to register item quantities and create license plates'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GRNItemsTable grnId={grnId} onItemReceived={fetchGRN} />
        </CardContent>
      </Card>
    </div>
  )
}
