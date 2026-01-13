/**
 * PO Header Component
 * Story 03.3: PO CRUD + Lines
 * Read-only header info display per PLAN-006
 */

'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LegacyPOStatusBadge as POStatusBadge } from './POStatusBadge'
import type { PurchaseOrderWithLines, POStatus } from '@/lib/types/purchase-order'
import { getRelativeDeliveryDate } from '@/lib/types/purchase-order'

interface POHeaderProps {
  po: PurchaseOrderWithLines
  className?: string
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function POHeader({ po, className }: POHeaderProps) {
  return (
    <div className={cn('border rounded-lg p-6', className)}>
      {/* Top Row: PO Number and Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono">{po.po_number}</h1>
          <p className="text-sm text-muted-foreground">
            Created by: {po.created_by_user?.name || 'Unknown'} on{' '}
            {formatDate(po.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <POStatusBadge status={po.status as POStatus} size="lg" />
          {po.status === 'receiving' && po.receive_percent > 0 && (
            <Badge variant="outline" className="text-purple-700 border-purple-300">
              {po.receive_percent}% Received
            </Badge>
          )}
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Supplier */}
        <div className="border rounded-lg p-3 bg-gray-50/50">
          <p className="text-xs text-muted-foreground mb-1">Supplier</p>
          <p className="font-medium">{po.supplier?.name || '-'}</p>
          <p className="text-xs text-muted-foreground">{po.supplier?.code || ''}</p>
          {po.supplier_id && (
            <Link
              href={`/planning/suppliers/${po.supplier_id}`}
              className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mt-1"
            >
              View Supplier
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Warehouse */}
        <div className="border rounded-lg p-3 bg-gray-50/50">
          <p className="text-xs text-muted-foreground mb-1">Warehouse</p>
          <p className="font-medium">{po.warehouse?.name || '-'}</p>
          <p className="text-xs text-muted-foreground">{po.warehouse?.code || ''}</p>
        </div>

        {/* Expected Delivery */}
        <div className="border rounded-lg p-3 bg-gray-50/50">
          <p className="text-xs text-muted-foreground mb-1">Expected Delivery</p>
          <p className="font-medium">{formatDate(po.expected_delivery_date)}</p>
          <p className="text-xs text-muted-foreground">
            {getRelativeDeliveryDate(po.expected_delivery_date)}
          </p>
        </div>

        {/* Currency */}
        <div className="border rounded-lg p-3 bg-gray-50/50">
          <p className="text-xs text-muted-foreground mb-1">Currency</p>
          <p className="font-medium">{po.currency}</p>
        </div>
      </div>

      {/* Additional Info Row */}
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        {po.order_date && (
          <div>
            <span className="text-muted-foreground">Order Date: </span>
            <span className="font-medium">{formatDate(po.order_date)}</span>
          </div>
        )}
        {po.payment_terms && (
          <div>
            <span className="text-muted-foreground">Payment Terms: </span>
            <span className="font-medium">{po.payment_terms}</span>
          </div>
        )}
        {po.tax_code && (
          <div>
            <span className="text-muted-foreground">Tax Code: </span>
            <span className="font-medium">{po.tax_code.name}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {po.notes && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-1">Notes:</p>
          <p className="text-sm bg-gray-50 p-2 rounded">{po.notes}</p>
        </div>
      )}

      {/* Approval Info */}
      {po.approval_status === 'approved' && po.approved_by_user && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-1">Approval:</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
              Approved
            </Badge>
            <span className="text-sm">
              by {po.approved_by_user.name}
              {po.approved_at && ` on ${formatDate(po.approved_at)}`}
            </span>
          </div>
          {po.approval_notes && (
            <p className="text-sm text-muted-foreground mt-1">
              "{po.approval_notes}"
            </p>
          )}
        </div>
      )}

      {po.approval_status === 'rejected' && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-1">Rejection:</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
              Rejected
            </Badge>
            {po.rejection_reason && (
              <span className="text-sm text-red-600">
                {po.rejection_reason}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default POHeader
