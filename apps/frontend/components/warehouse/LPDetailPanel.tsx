/**
 * LP Detail Panel Component (Slide-in)
 * Story 05.1: License Plates UI
 */

'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LPStatusBadge } from './LPStatusBadge'
import { LPQAStatusBadge } from './LPQAStatusBadge'
import { LPExpiryIndicator } from './LPExpiryIndicator'
import type { LicensePlate } from '@/lib/types/license-plate'
import { X } from 'lucide-react'

interface LPDetailPanelProps {
  lp: LicensePlate | null
  open: boolean
  onClose: () => void
  onBlock?: (lpId: string, reason: string) => void
  onUnblock?: (lpId: string) => void
  onUpdateQA?: (lpId: string) => void
}

export function LPDetailPanel({ lp, open, onClose, onBlock, onUnblock, onUpdateQA }: LPDetailPanelProps) {
  if (!lp) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" data-testid="lp-detail-panel">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle>License Plate Detail</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="close-button"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* IDENTITY */}
          <div>
            <h3 className="font-semibold mb-3">IDENTITY</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">LP Number:</span>
                <span className="col-span-2 font-medium">{lp.lp_number}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Status:</span>
                <div className="col-span-2">
                  <LPStatusBadge status={lp.status} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">QA Status:</span>
                <div className="col-span-2">
                  <LPQAStatusBadge qaStatus={lp.qa_status} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Source:</span>
                <span className="col-span-2 capitalize">{lp.source}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* PRODUCT & QUANTITY */}
          <div>
            <h3 className="font-semibold mb-3">PRODUCT & QUANTITY</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Product:</span>
                <span className="col-span-2 font-medium">
                  {lp.product?.name} ({lp.product?.code})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="col-span-2 font-medium">
                  {lp.quantity.toLocaleString()} {lp.uom}
                </span>
              </div>
              {lp.catch_weight_kg && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Catch Weight:</span>
                  <span className="col-span-2">{lp.catch_weight_kg} KG</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* LOCATION */}
          <div>
            <h3 className="font-semibold mb-3">LOCATION</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Warehouse:</span>
                <span className="col-span-2">
                  {lp.warehouse?.name} ({lp.warehouse?.code})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Location:</span>
                <span className="col-span-2">{lp.location?.full_path}</span>
              </div>
              {lp.location?.bin_code && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Bin:</span>
                  <span className="col-span-2">{lp.location.bin_code}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* TRACKING & TRACEABILITY */}
          <div>
            <h3 className="font-semibold mb-3">TRACKING & TRACEABILITY</h3>
            <div className="space-y-2 text-sm">
              {lp.batch_number && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Batch Number:</span>
                  <span className="col-span-2">{lp.batch_number}</span>
                </div>
              )}
              {lp.supplier_batch_number && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Supplier Batch:</span>
                  <span className="col-span-2">{lp.supplier_batch_number}</span>
                </div>
              )}
              {lp.manufacture_date && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Manufacture Date:</span>
                  <span className="col-span-2">
                    {new Date(lp.manufacture_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {lp.expiry_date && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Expiry Date:</span>
                  <div className="col-span-2">
                    <LPExpiryIndicator expiryDate={lp.expiry_date} format="long" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* AUDIT TRAIL */}
          <div>
            <h3 className="font-semibold mb-3">AUDIT TRAIL</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Created At:</span>
                <span className="col-span-2">
                  {new Date(lp.created_at).toLocaleString()}
                </span>
              </div>
              {lp.created_by_user && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Created By:</span>
                  <span className="col-span-2">{lp.created_by_user.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div data-testid="quick-actions" className="flex flex-wrap gap-2 pt-4">
            {lp.status === 'available' && onBlock && (
              <Button variant="outline" size="sm" onClick={() => onBlock(lp.id, '')}>
                Block LP
              </Button>
            )}
            {lp.status === 'blocked' && onUnblock && (
              <Button variant="outline" size="sm" onClick={() => onUnblock(lp.id)}>
                Unblock LP
              </Button>
            )}
            {onUpdateQA && (
              <Button variant="outline" size="sm" onClick={() => onUpdateQA(lp.id)}>
                Update QA Status
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
