/**
 * ASN Detail Page
 * Story 05.8: ASN Management
 * AC-10: ASN detail view with all fields and items
 */

'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useASN, useCancelASN, useInitiateReceiving } from '@/lib/hooks/use-asns'
import { AsnStatusBadge } from '@/components/warehouse/asns/AsnStatusBadge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ASNDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const { data: asn, isLoading, error } = useASN(id)
  const cancelASN = useCancelASN()
  const initiateReceiving = useInitiateReceiving()

  const handleCancel = async () => {
    try {
      await cancelASN.mutateAsync(id)
      toast({
        title: 'Success',
        description: 'ASN cancelled successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel ASN',
        variant: 'destructive',
      })
    }
  }

  const handleReceive = async () => {
    try {
      const result = await initiateReceiving.mutateAsync(id)
      toast({
        title: 'Success',
        description: 'Receiving initiated',
      })
      router.push(`/warehouse/grns/${result.grn_id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initiate receiving',
        variant: 'destructive',
      })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Error state
  if (error || !asn) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading ASN</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {error?.message || 'ASN not found'}
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  // Helper to generate tracking URL
  const getTrackingUrl = (carrier?: string | null, trackingNumber?: string | null) => {
    if (!carrier || !trackingNumber) return null
    const lowerCarrier = carrier.toLowerCase()
    if (lowerCarrier.includes('fedex')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`
    }
    if (lowerCarrier.includes('ups')) {
      return `https://www.ups.com/track?tracknum=${trackingNumber}`
    }
    if (lowerCarrier.includes('dhl')) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`
    }
    return null
  }

  const trackingUrl = getTrackingUrl(asn.carrier, asn.tracking_number)

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-asn-number>
            {asn.asn_number}
          </h1>
          <p className="text-muted-foreground text-sm">Advance Shipping Notice Details</p>
        </div>
        <div className="flex gap-2">
          {asn.status === 'pending' && (
            <>
              <Button variant="outline" onClick={() => router.push(`/warehouse/asns/${id}/edit`)}>
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">Cancel ASN</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this ASN?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the ASN as cancelled. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>Confirm</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {(asn.status === 'pending' || asn.status === 'partial') && (
            <Button onClick={handleReceive}>Receive</Button>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <AsnStatusBadge status={asn.status} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">PO Number</p>
            <Link
              href={`/planning/purchase-orders/${asn.po_id}`}
              data-po-number
              className="font-medium text-blue-600 hover:underline"
            >
              {asn.po_number}
            </Link>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Supplier</p>
            <p className="font-medium" data-supplier-name>
              {asn.supplier_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Expected Date</p>
            <p className="font-medium" data-expected-date>
              {new Date(asn.expected_date).toLocaleDateString()}
            </p>
          </div>
          {asn.actual_date && (
            <div>
              <p className="text-sm text-muted-foreground">Actual Date</p>
              <p className="font-medium">{new Date(asn.actual_date).toLocaleDateString()}</p>
            </div>
          )}
          {asn.carrier && (
            <div>
              <p className="text-sm text-muted-foreground">Carrier</p>
              <p className="font-medium" data-carrier>
                {asn.carrier}
              </p>
            </div>
          )}
          {asn.tracking_number && (
            <div>
              <p className="text-sm text-muted-foreground">Tracking Number</p>
              {trackingUrl ? (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                  data-tracking-link
                  data-tracking-number
                >
                  {asn.tracking_number}
                </a>
              ) : (
                <p className="font-medium" data-tracking-number>
                  {asn.tracking_number}
                </p>
              )}
            </div>
          )}
        </div>
        {asn.notes && (
          <div>
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="font-medium">{asn.notes}</p>
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Items</h2>
          {asn.status === 'pending' && (
            <Button variant="outline">Add Line</Button>
          )}
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Code</TableHead>
                <TableHead>Expected Qty</TableHead>
                <TableHead>Received Qty</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>GTIN</TableHead>
                <TableHead>Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asn.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_id}</TableCell>
                  <TableCell>{item.expected_qty}</TableCell>
                  <TableCell>{item.received_qty}</TableCell>
                  <TableCell>{item.uom}</TableCell>
                  <TableCell>{item.supplier_batch_number || '-'}</TableCell>
                  <TableCell>{item.gtin || '-'}</TableCell>
                  <TableCell>
                    {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
