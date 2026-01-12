/**
 * Step 4: Review & Confirm Component (Story 05.19)
 * Purpose: Review summary before confirmation
 */

'use client'

import { cn } from '@/lib/utils'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { Button } from '@/components/ui/button'
import { Edit2, Package, MapPin, Hash, Calendar } from 'lucide-react'

interface ReviewFormData {
  poId: string
  poLineId: string
  productName: string
  productCode?: string
  receivedQty: number
  uom: string
  batchNumber?: string
  expiryDate?: string
  locationPath?: string
}

interface Step4ReviewConfirmProps {
  formData: ReviewFormData
  isLoading?: boolean
  onConfirm: () => void
  onEdit: (step: number) => void
}

function ReviewRow({
  icon,
  label,
  value,
  onEdit,
}: {
  icon: React.ReactNode
  label: string
  value: string | undefined
  onEdit?: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-sm font-medium text-gray-900">{value || '-'}</div>
        </div>
      </div>
      {onEdit && (
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-10 w-10 min-h-[40px]">
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export function Step4ReviewConfirm({
  formData,
  isLoading,
  onConfirm,
  onEdit,
}: Step4ReviewConfirmProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Review header */}
      <div className="p-4 bg-blue-50 border-b border-blue-100">
        <h2 className="text-lg font-semibold text-blue-900">Review Receipt</h2>
        <p className="text-sm text-blue-700 mt-1">Please verify all details before confirming.</p>
      </div>

      {/* Review details */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <ReviewRow
            icon={<Package className="h-5 w-5" />}
            label="Product"
            value={`${formData.productName}${formData.productCode ? ` (${formData.productCode})` : ''}`}
          />

          <ReviewRow
            icon={
              <span className="font-bold text-lg leading-5">
                {formData.receivedQty}
              </span>
            }
            label="Quantity"
            value={`${formData.receivedQty} ${formData.uom}`}
            onEdit={() => onEdit(3)}
          />

          {formData.batchNumber && (
            <ReviewRow
              icon={<Hash className="h-5 w-5" />}
              label="Batch Number"
              value={formData.batchNumber}
              onEdit={() => onEdit(3)}
            />
          )}

          {formData.expiryDate && (
            <ReviewRow
              icon={<Calendar className="h-5 w-5" />}
              label="Expiry Date"
              value={formData.expiryDate}
              onEdit={() => onEdit(3)}
            />
          )}

          {formData.locationPath && (
            <ReviewRow
              icon={<MapPin className="h-5 w-5" />}
              label="Location"
              value={formData.locationPath}
              onEdit={() => onEdit(3)}
            />
          )}
        </div>
      </div>

      {/* Confirm button */}
      <div className="p-4 border-t border-gray-200 bg-white safe-area-bottom">
        <LargeTouchButton
          size="full"
          variant="success"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Confirm Receipt'}
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default Step4ReviewConfirm
