/**
 * Step 3: Enter Details Component (Story 05.19)
 * Purpose: Enter receipt details with number pad
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { NumberPad } from '../shared/NumberPad'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from 'lucide-react'
import type { POLineForScanner } from '@/lib/validation/scanner-receive'

interface ReceiptFormData {
  receivedQty: string
  batchNumber: string
  expiryDate: string
  locationId: string
}

interface Step3EnterDetailsProps {
  line: POLineForScanner
  defaultLocationId?: string
  requireBatch?: boolean
  requireExpiry?: boolean
  onSubmit: (data: ReceiptFormData) => void
  onBack?: () => void
}

export function Step3EnterDetails({
  line,
  defaultLocationId = '',
  requireBatch = false,
  requireExpiry = false,
  onSubmit,
}: Step3EnterDetailsProps) {
  const [formData, setFormData] = useState<ReceiptFormData>({
    receivedQty: String(line.remaining_qty),
    batchNumber: '',
    expiryDate: '',
    locationId: defaultLocationId,
  })

  const [showNumberPad, setShowNumberPad] = useState(true)

  const handleQuantityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, receivedQty: value }))
  }

  const handleQuickAdjust = (delta: number) => {
    const currentValue = parseFloat(formData.receivedQty) || 0
    const newValue = Math.max(0, currentValue + delta)
    setFormData((prev) => ({ ...prev, receivedQty: String(newValue) }))
  }

  const handleSubmit = () => {
    onSubmit(formData)
  }

  const receivedQty = parseFloat(formData.receivedQty) || 0
  const isOverReceipt = receivedQty > line.remaining_qty
  const isValid =
    receivedQty > 0 &&
    (!requireBatch || formData.batchNumber.length > 0) &&
    (!requireExpiry || formData.expiryDate.length > 0)

  return (
    <div className="flex-1 flex flex-col">
      {/* Product info */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">{line.product_name}</span>
          <span className="text-sm text-gray-500">{line.product_code}</span>
        </div>
        <div className="mt-1 text-sm text-gray-600">
          Remaining: {line.remaining_qty} {line.uom}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quantity display */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Receive Quantity</Label>
          <div
            className={cn(
              'mt-1 h-14 px-4 flex items-center justify-between rounded-lg border-2 text-2xl font-semibold',
              isOverReceipt ? 'border-yellow-400 bg-yellow-50' : 'border-blue-500 bg-blue-50'
            )}
            onClick={() => setShowNumberPad(true)}
          >
            <span>{formData.receivedQty || '0'}</span>
            <span className="text-sm font-normal text-gray-500">{line.uom}</span>
          </div>
          {isOverReceipt && (
            <p className="mt-1 text-sm text-yellow-600">
              Exceeds remaining by {(receivedQty - line.remaining_qty).toFixed(2)} {line.uom}
            </p>
          )}
        </div>

        {/* Batch number */}
        <div>
          <Label htmlFor="batch" className="text-sm font-medium text-gray-700">
            Batch Number
            {requireBatch && <span className="text-red-500 ml-1">Required</span>}
          </Label>
            <Input
              id="batch"
              value={formData.batchNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, batchNumber: e.target.value }))}
              placeholder="Enter batch number"
              className="mt-1 h-12 min-h-[48px] text-lg"
              onFocus={() => setShowNumberPad(false)}
            />
        </div>

        {/* Expiry date */}
        <div>
            <Label htmlFor="expiry" className="text-sm font-medium text-gray-700">
              Expiry Date
              {requireExpiry && <span className="text-red-500 ml-1">Required</span>}
            </Label>
            <div className="mt-1 relative">
              <Input
                id="expiry"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                className="h-12 min-h-[48px] text-lg pr-10"
                onFocus={() => setShowNumberPad(false)}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
        </div>
      </div>

      {/* Number pad */}
      {showNumberPad && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <NumberPad
            value={formData.receivedQty}
            onChange={handleQuantityChange}
            onQuickAdjust={handleQuickAdjust}
            allowDecimal
          />
        </div>
      )}

      {/* Submit button */}
      <div className="p-4 border-t border-gray-200 bg-white safe-area-bottom">
        <LargeTouchButton size="full" variant="primary" onClick={handleSubmit} disabled={!isValid}>
          Continue to Review
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default Step3EnterDetails
