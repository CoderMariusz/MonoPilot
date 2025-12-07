/**
 * LP Detail Panel Component
 * Story 5.1-5.4: LP Core UI
 * Sliding panel with LP details, status changes, history
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { LPStatusBadge } from './LPStatusBadge'
import { LPSplitModal } from './LPSplitModal'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Calendar, Package, MapPin, Hash, Barcode, AlertTriangle, Split } from 'lucide-react'
import { format } from 'date-fns'

interface LicensePlate {
  id: string
  lp_number: string
  product_id: string
  product?: {
    code: string
    name: string
    uom: string
  }
  warehouse_id: string
  warehouse?: {
    code: string
    name: string
  }
  location_id: string
  location?: {
    code: string
  }
  quantity: number
  current_qty: number
  status: 'available' | 'reserved' | 'consumed' | 'shipped' | 'quarantine' | 'recalled' | 'merged'
  qa_status: 'pending' | 'passed' | 'failed' | 'on_hold' | null
  batch_number?: string
  supplier_batch_number?: string
  manufacturing_date?: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

interface LPDetailPanelProps {
  open: boolean
  lp: LicensePlate | null
  onClose: () => void
  onRefresh: () => void
}

export function LPDetailPanel({ open, lp, onClose, onRefresh }: LPDetailPanelProps) {
  const [changing, setChanging] = useState(false)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const { toast } = useToast()

  if (!lp) return null

  const handleStatusChange = async (newStatus: string) => {
    try {
      setChanging(true)

      const response = await fetch(`/api/warehouse/license-plates/${lp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update status')
      }

      toast({
        title: 'Success',
        description: `Status changed to ${newStatus}`,
      })

      onRefresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setChanging(false)
    }
  }

  const handleQAStatusChange = async (newQAStatus: string) => {
    try {
      setChanging(true)

      const response = await fetch(`/api/warehouse/license-plates/${lp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qa_status: newQAStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update QA status')
      }

      toast({
        title: 'Success',
        description: `QA status changed to ${newQAStatus}`,
      })

      onRefresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setChanging(false)
    }
  }

  const isExpiringSoon = () => {
    if (!lp.expiry_date) return false
    const expiryDate = new Date(lp.expiry_date)
    const today = new Date()
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const isExpired = () => {
    if (!lp.expiry_date) return false
    return new Date(lp.expiry_date) < new Date()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {lp.lp_number}
          </SheetTitle>
          <SheetDescription>License Plate Details</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Section */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Status</h3>
            <div className="flex gap-2">
              <LPStatusBadge status={lp.status} />
              {lp.qa_status && (
                <Badge variant={lp.qa_status === 'passed' ? 'default' : lp.qa_status === 'failed' ? 'destructive' : 'secondary'}>
                  QA: {lp.qa_status}
                </Badge>
              )}
            </div>
          </div>

          {/* Expiry Warning */}
          {(isExpiringSoon() || isExpired()) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  {isExpired() ? 'Expired' : 'Expiring Soon'}
                </p>
                <p className="text-sm text-yellow-700">
                  {isExpired()
                    ? `Expired on ${format(new Date(lp.expiry_date!), 'PPP')}`
                    : `Expires on ${format(new Date(lp.expiry_date!), 'PPP')}`
                  }
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Product Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Product Information</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Product</dt>
                <dd className="font-medium">
                  {lp.product?.code} - {lp.product?.name}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-muted-foreground">Quantity</dt>
                  <dd className="font-medium">
                    {lp.current_qty} {lp.product?.uom}
                  </dd>
                </div>
                {lp.quantity !== lp.current_qty && (
                  <div>
                    <dt className="text-muted-foreground">Original Qty</dt>
                    <dd className="font-medium text-muted-foreground">
                      {lp.quantity} {lp.product?.uom}
                    </dd>
                  </div>
                )}
              </div>
            </dl>
          </div>

          <Separator />

          {/* Location Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Location</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Warehouse
                </dt>
                <dd className="font-medium">
                  {lp.warehouse?.code} - {lp.warehouse?.name}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="font-medium">{lp.location?.code}</dd>
              </div>
            </dl>
          </div>

          <Separator />

          {/* Batch & Dates */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Traceability</h3>
            <dl className="space-y-2 text-sm">
              {lp.batch_number && (
                <div>
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Batch Number
                  </dt>
                  <dd className="font-medium">{lp.batch_number}</dd>
                </div>
              )}
              {lp.supplier_batch_number && (
                <div>
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Barcode className="h-3 w-3" /> Supplier Batch
                  </dt>
                  <dd className="font-medium">{lp.supplier_batch_number}</dd>
                </div>
              )}
              {lp.manufacturing_date && (
                <div>
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Manufacturing Date
                  </dt>
                  <dd className="font-medium">{format(new Date(lp.manufacturing_date), 'PPP')}</dd>
                </div>
              )}
              {lp.expiry_date && (
                <div>
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Expiry Date
                  </dt>
                  <dd className={`font-medium ${isExpired() ? 'text-red-600' : isExpiringSoon() ? 'text-yellow-600' : ''}`}>
                    {format(new Date(lp.expiry_date), 'PPP')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <Separator />

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Audit Trail</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium">{format(new Date(lp.created_at), 'PPP p')}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last Updated</dt>
                <dd className="font-medium">{format(new Date(lp.updated_at), 'PPP p')}</dd>
              </div>
            </dl>
          </div>

          <Separator />

          {/* Status Actions */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Actions</h3>
            <div className="space-y-2">
              {lp.status === 'available' && lp.current_qty > 1 && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowSplitModal(true)}
                  disabled={changing}
                >
                  <Split className="mr-2 h-4 w-4" />
                  Split LP
                </Button>
              )}
              {lp.status === 'available' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleStatusChange('quarantine')}
                  disabled={changing}
                >
                  {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Move to Quarantine
                </Button>
              )}
              {lp.status === 'quarantine' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleStatusChange('available')}
                  disabled={changing}
                >
                  {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Release from Quarantine
                </Button>
              )}
              {lp.qa_status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-green-600"
                    onClick={() => handleQAStatusChange('passed')}
                    disabled={changing}
                  >
                    {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pass QA
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600"
                    onClick={() => handleQAStatusChange('failed')}
                    disabled={changing}
                  >
                    {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Fail QA
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </SheetContent>

      {/* Split Modal */}
      <LPSplitModal
        open={showSplitModal}
        lp={lp}
        onClose={() => setShowSplitModal(false)}
        onSuccess={(newLPs) => {
          setShowSplitModal(false)
          onRefresh()
          toast({
            title: 'Success',
            description: `Created ${newLPs.length} new license plates`,
          })
        }}
      />
    </Sheet>
  )
}
