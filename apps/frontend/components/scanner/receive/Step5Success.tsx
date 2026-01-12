/**
 * Step 5: Success Component (Story 05.19)
 * Purpose: Success screen with print options
 */

'use client'

import { LargeTouchButton } from '../shared/LargeTouchButton'
import { SuccessAnimation } from '../shared/SuccessAnimation'
import { Printer, ArrowRight, Package, Home } from 'lucide-react'
import type { ScannerReceiveResult } from '@/lib/validation/scanner-receive'

interface Step5SuccessProps {
  result: ScannerReceiveResult
  onReceiveMore: () => void
  onNewPO: () => void
  onDone: () => void
  onReprintLabel?: () => void
}

export function Step5Success({
  result,
  onReceiveMore,
  onNewPO,
  onDone,
  onReprintLabel,
}: Step5SuccessProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Success animation and header */}
      <div className="p-8 flex flex-col items-center bg-green-50">
        <SuccessAnimation show size={80} />
        <h2 className="mt-4 text-xl font-semibold text-green-900">Receipt Complete!</h2>
      </div>

      {/* Receipt details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* GRN info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">GRN Number</div>
          <div className="text-lg font-semibold text-gray-900">{result.grn.grn_number}</div>
        </div>

        {/* LP info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">License Plate</div>
          <div className="text-lg font-semibold text-gray-900">{result.lp.lp_number}</div>

          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Product</div>
              <div className="font-medium text-gray-900">{result.lp.product_name}</div>
            </div>
            <div>
              <div className="text-gray-500">Quantity</div>
              <div className="font-medium text-gray-900">
                {result.lp.quantity} {result.lp.uom}
              </div>
            </div>
            {result.lp.batch_number && (
              <div>
                <div className="text-gray-500">Batch</div>
                <div className="font-medium text-gray-900">{result.lp.batch_number}</div>
              </div>
            )}
            {result.lp.expiry_date && (
              <div>
                <div className="text-gray-500">Expiry</div>
                <div className="font-medium text-gray-900">{result.lp.expiry_date}</div>
              </div>
            )}
          </div>

          {result.lp.location_path && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">Location</div>
              <div className="text-sm font-medium text-gray-900">{result.lp.location_path}</div>
            </div>
          )}
        </div>

        {/* Print status */}
        {result.printJobId && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 flex items-center gap-3">
            <Printer className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-800">Label sent to printer</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-gray-200 bg-white space-y-3 safe-area-bottom">
        {onReprintLabel && (
          <LargeTouchButton size="full" variant="secondary" onClick={onReprintLabel}>
            <Printer className="h-5 w-5 mr-2" />
            Reprint Label
          </LargeTouchButton>
        )}

        <div className="grid grid-cols-2 gap-3">
          <LargeTouchButton variant="secondary" onClick={onReceiveMore}>
            <Package className="h-5 w-5 mr-2" />
            Receive More
          </LargeTouchButton>

          <LargeTouchButton variant="secondary" onClick={onNewPO}>
            <ArrowRight className="h-5 w-5 mr-2" />
            New PO
          </LargeTouchButton>
        </div>

        <LargeTouchButton size="full" variant="primary" onClick={onDone}>
          <Home className="h-5 w-5 mr-2" />
          Done
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default Step5Success
