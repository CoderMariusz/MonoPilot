/**
 * ASN Detail Page
 * Epic 5 Batch 5A-3 - Story 5.8: ASN Creation
 * AC-5.8.3: View ASN details with items and actions
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Edit, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ASNItemsTable } from '@/components/warehouse/ASNItemsTable'
import { format } from 'date-fns'

interface ASN {
  id: string
  asn_number: string
  po_id: string
  status: string
  expected_arrival_date: string
  carrier: string | null
  tracking_number: string | null
  notes: string | null
  purchase_orders: {
    id: string
    po_number: string
  }
  suppliers: {
    code: string
    name: string
  }
  warehouses: {
    code: string
    name: string
  }
  created_at: string
  updated_at: string
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  submitted: 'bg-blue-100 text-blue-800 border-blue-300',
  receiving: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  received: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  receiving: 'Receiving',
  received: 'Received',
  cancelled: 'Cancelled',
}

export default function ASNDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [asn, setAsn] = useState<ASN | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const asnId = params.id as string

  // Fetch ASN details
  const fetchASN = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/warehouse/asns/${asnId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch ASN')
      }

      const data = await response.json()
      setAsn(data.asn)
    } catch (error) {
      console.error('Error fetching ASN:', error)
      toast({
        title: 'Error',
        description: 'Failed to load ASN details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchASN()
  }, [asnId])

  const handleSubmitASN = async () => {
    if (!asn) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/warehouse/asns/${asnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit ASN')
      }

      toast({
        title: 'Success',
        description: 'ASN submitted successfully',
      })

      fetchASN()
    } catch (error) {
      console.error('Error submitting ASN:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit ASN',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="text-center py-8 text-muted-foreground">Loading ASN details...</div>
      </div>
    )
  }

  if (!asn) {
    return (
      <div className="px-6 py-6">
        <div className="text-center py-8 text-muted-foreground">ASN not found</div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/warehouse/asns')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{asn.asn_number}</h1>
            <p className="text-sm text-muted-foreground">Advance Shipping Notice</p>
          </div>
          <Badge variant="outline" className={STATUS_COLORS[asn.status as keyof typeof STATUS_COLORS]}>
            {STATUS_LABELS[asn.status as keyof typeof STATUS_LABELS]}
          </Badge>
        </div>

        <div className="flex gap-2">
          {asn.status === 'draft' && (
            <>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={handleSubmitASN} disabled={submitting}>
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </>
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
              <div className="text-muted-foreground">ASN Number:</div>
              <div className="font-medium">{asn.asn_number}</div>

              <div className="text-muted-foreground">PO Number:</div>
              <div>
                <button
                  onClick={() => router.push(`/planning/purchase-orders/${asn.purchase_orders.id}`)}
                  className="text-blue-600 hover:underline"
                >
                  {asn.purchase_orders.po_number}
                </button>
              </div>

              <div className="text-muted-foreground">Supplier:</div>
              <div>
                <div className="font-medium">{asn.suppliers.name}</div>
                <div className="text-muted-foreground text-xs">{asn.suppliers.code}</div>
              </div>

              <div className="text-muted-foreground">Warehouse:</div>
              <div>
                {asn.warehouses.code} - {asn.warehouses.name}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Shipment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Expected Arrival:</div>
              <div>
                {asn.expected_arrival_date
                  ? format(new Date(asn.expected_arrival_date), 'MMM dd, yyyy')
                  : '-'}
              </div>

              <div className="text-muted-foreground">Carrier:</div>
              <div>{asn.carrier || '-'}</div>

              <div className="text-muted-foreground">Tracking Number:</div>
              <div>{asn.tracking_number || '-'}</div>

              <div className="text-muted-foreground">Created:</div>
              <div>{format(new Date(asn.created_at), 'MMM dd, yyyy HH:mm')}</div>

              <div className="text-muted-foreground">Last Updated:</div>
              <div>{format(new Date(asn.updated_at), 'MMM dd, yyyy HH:mm')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {asn.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{asn.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expected Items</CardTitle>
          <CardDescription>Items expected in this shipment</CardDescription>
        </CardHeader>
        <CardContent>
          <ASNItemsTable
            asnId={asnId}
            poId={asn.po_id}
            isDraft={asn.status === 'draft'}
          />
        </CardContent>
      </Card>
    </div>
  )
}
