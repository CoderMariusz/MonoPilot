/**
 * Step 2: Review Lines Component (Story 05.19)
 * Purpose: Review PO lines and select for receiving
 */

'use client'

import { cn } from '@/lib/utils'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { ScanLine, CheckCircle2, Circle } from 'lucide-react'
import type { POLineForScanner } from '@/lib/validation/scanner-receive'

interface Step2ReviewLinesProps {
  poId: string
  poNumber: string
  supplierName: string
  lines: POLineForScanner[]
  onLineSelected: (lineId: string) => void
  onReceiveAll?: () => void
  onScanProduct?: () => void
}

export function Step2ReviewLines({
  poNumber,
  supplierName,
  lines,
  onLineSelected,
  onReceiveAll,
  onScanProduct,
}: Step2ReviewLinesProps) {
  const pendingLines = lines.filter((line) => line.remaining_qty > 0)
  const hasRemainingLines = pendingLines.length > 0

  return (
    <div className="flex-1 flex flex-col">
      {/* PO Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">{poNumber}</span>
          <span className="text-sm text-gray-500">{lines.length} lines</span>
        </div>
        <div className="mt-1 text-sm text-gray-600">{supplierName}</div>
      </div>

      {/* Lines list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {lines.map((line) => {
          const isComplete = line.remaining_qty <= 0
          const progress = (line.received_qty / line.ordered_qty) * 100

          return (
            <button
              key={line.id}
              data-testid="po-line"
              onClick={() => !isComplete && onLineSelected(line.id)}
              disabled={isComplete}
              className={cn(
                'w-full min-h-[64px] p-4 rounded-lg border',
                'flex flex-col items-start text-left transition-colors',
                isComplete
                  ? 'border-gray-100 bg-gray-50 opacity-60'
                  : 'border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100'
              )}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                  <span className={cn('font-medium', isComplete ? 'text-gray-500' : 'text-gray-900')}>
                    {line.product_name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{line.product_code}</span>
              </div>

              <div className="mt-2 w-full">
                {/* Progress bar */}
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      isComplete ? 'bg-green-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>

                <div className="mt-1 flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    Received: {line.received_qty} / {line.ordered_qty} {line.uom}
                  </span>
                  {!isComplete && (
                    <span className="text-blue-600 font-medium">
                      Remaining: {line.remaining_qty} {line.uom}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-200 bg-white space-y-3 safe-area-bottom">
        {onScanProduct && (
          <LargeTouchButton size="full" variant="secondary" onClick={onScanProduct}>
            <ScanLine className="h-5 w-5 mr-2" />
            Scan Product Barcode
          </LargeTouchButton>
        )}

        {hasRemainingLines && onReceiveAll && pendingLines.length > 1 && (
          <LargeTouchButton size="full" variant="primary" onClick={onReceiveAll}>
            Receive All Remaining ({pendingLines.length} items)
          </LargeTouchButton>
        )}
      </div>
    </div>
  )
}

export default Step2ReviewLines
