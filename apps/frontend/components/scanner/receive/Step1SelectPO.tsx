/**
 * Step 1: Select PO Component (Story 05.19)
 * Purpose: Select PO source via list or scan
 */

'use client'

import { cn } from '@/lib/utils'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { Loader2, ScanLine, Package } from 'lucide-react'
import type { PendingReceiptSummary } from '@/lib/validation/scanner-receive'

interface Step1SelectPOProps {
  pendingPOs: PendingReceiptSummary[]
  isLoading?: boolean
  error?: string
  onPOSelected: (poId: string) => void
  onScanBarcode?: () => void
}

export function Step1SelectPO({
  pendingPOs,
  isLoading,
  error,
  onPOSelected,
  onScanBarcode,
}: Step1SelectPOProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-2 text-gray-600">Loading pending orders...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <p className="text-red-600 text-center">{error}</p>
        <LargeTouchButton variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </LargeTouchButton>
      </div>
    )
  }

  // Empty state
  if (pendingPOs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Package className="h-16 w-16 text-gray-400" />
        <p className="mt-4 text-gray-600 text-center">No pending orders to receive</p>
        {onScanBarcode && (
          <LargeTouchButton variant="primary" className="mt-6" onClick={onScanBarcode}>
            <ScanLine className="h-5 w-5 mr-2" />
            Scan PO Barcode
          </LargeTouchButton>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* PO List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {pendingPOs.map((po) => (
          <button
            key={po.id}
            onClick={() => onPOSelected(po.id)}
            className={cn(
              'w-full min-h-[64px] p-4 rounded-lg border border-gray-200',
              'bg-white hover:bg-gray-50 active:bg-gray-100',
              'flex flex-col items-start text-left transition-colors'
            )}
          >
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold text-gray-900">{po.po_number}</span>
              <span className="text-sm text-gray-500">
                {po.lines_pending}/{po.lines_total} lines
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-600">{po.supplier_name}</div>
            <div className="mt-1 flex justify-between items-center w-full text-sm">
              <span className="text-gray-500">Expected: {po.expected_date}</span>
              <span className="text-blue-600 font-medium">
                {po.total_qty_received}/{po.total_qty_ordered}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-200 bg-white space-y-3 safe-area-bottom">
        {onScanBarcode && (
          <LargeTouchButton size="full" variant="primary" onClick={onScanBarcode}>
            <ScanLine className="h-5 w-5 mr-2" />
            Scan PO Barcode
          </LargeTouchButton>
        )}
      </div>
    </div>
  )
}

export default Step1SelectPO
