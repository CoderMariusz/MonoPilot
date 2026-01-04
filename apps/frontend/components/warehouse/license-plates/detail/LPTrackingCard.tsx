/**
 * LP Tracking Card Component
 * Story 05.6: LP Detail Page
 *
 * Tracking section - batch, expiry, manufacture date
 */

import React from 'react'
import { format, parseISO } from 'date-fns'
import { FileText } from 'lucide-react'
import { LPFieldLabel } from './LPFieldLabel'
import { LPExpiryIndicator } from './LPExpiryIndicator'

interface LPTrackingCardProps {
  batchNumber: string | null
  supplierBatchNumber: string | null
  expiryDate: string | null
  manufactureDate: string | null
}

export function LPTrackingCard({
  batchNumber,
  supplierBatchNumber,
  expiryDate,
  manufactureDate,
}: LPTrackingCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="tracking-card">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">Tracking</h3>
      </div>

      <div className="space-y-4">
        <LPFieldLabel label="Batch Number" value={batchNumber || ''} />

        <LPFieldLabel
          label="Supplier Batch"
          value={<span data-testid="supplier-batch">{supplierBatchNumber || '-'}</span>}
        />

        <LPFieldLabel
          label="Expiry Date"
          value={<LPExpiryIndicator expiryDate={expiryDate} />}
        />

        <LPFieldLabel
          label="Manufacture Date"
          value={manufactureDate ? format(parseISO(manufactureDate), 'MMM dd, yyyy') : ''}
        />
      </div>
    </div>
  )
}
