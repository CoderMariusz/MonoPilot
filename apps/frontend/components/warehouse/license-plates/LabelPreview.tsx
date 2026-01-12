/**
 * Label Preview Component (Story 05.14)
 * Purpose: Visual preview of LP label layout
 *
 * AC Coverage:
 * - AC-7: Label preview modal
 */

'use client'

import { cn } from '@/lib/utils'

interface LabelPreviewData {
  lp_number: string
  product_name: string
  quantity: number
  uom: string
  batch_number?: string | null
  expiry_date?: string | null
  manufacture_date?: string | null
  location_path?: string | null
}

interface LabelPreviewProps {
  data: LabelPreviewData
  className?: string
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '--'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export function LabelPreview({ data, className }: LabelPreviewProps) {
  return (
    <div
      data-testid="label-preview"
      className={cn(
        'aspect-[4/6] w-full max-w-[300px] border-2 border-gray-800 rounded bg-white p-4 font-mono text-sm',
        className
      )}
    >
      {/* Header */}
      <div className="text-xs font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3">
        License Plate
      </div>

      {/* Barcode Placeholder */}
      <div
        data-testid="barcode-placeholder"
        className="h-16 bg-gradient-to-b from-black via-black to-black mb-1 flex items-end justify-center"
        style={{
          background:
            'repeating-linear-gradient(90deg, black 0px, black 2px, white 2px, white 4px)',
        }}
      />
      <div className="text-center font-bold text-base mb-4">{data.lp_number}</div>

      {/* QR Code Placeholder */}
      <div className="absolute top-16 right-4">
        <div
          data-testid="qr-placeholder"
          className="w-16 h-16 border border-gray-600 bg-gray-100 flex items-center justify-center"
        >
          <div className="grid grid-cols-4 gap-0.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={cn('w-2 h-2', i % 3 === 0 ? 'bg-black' : 'bg-white')}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Label Fields */}
      <div className="space-y-2 text-xs relative">
        <div className="flex">
          <span className="w-20 text-gray-600">Product:</span>
          <span className="flex-1 font-medium">{truncateText(data.product_name, 40)}</span>
        </div>

        <div className="flex">
          <span className="w-20 text-gray-600">Qty:</span>
          <span className="flex-1 font-medium">
            {data.quantity} {data.uom}
          </span>
        </div>

        <div className="flex">
          <span className="w-20 text-gray-600">Batch:</span>
          <span className="flex-1 font-medium">{data.batch_number || '--'}</span>
        </div>

        <div className="flex">
          <span className="w-20 text-gray-600">Expiry:</span>
          <span className="flex-1 font-medium">{data.expiry_date || '--'}</span>
        </div>

        <div className="flex">
          <span className="w-20 text-gray-600">Location:</span>
          <span className="flex-1 font-medium text-[10px]">
            {truncateText(data.location_path, 35)}
          </span>
        </div>
      </div>
    </div>
  )
}
