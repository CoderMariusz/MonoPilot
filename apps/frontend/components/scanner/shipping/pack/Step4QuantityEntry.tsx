/**
 * Step 4: Quantity Entry Component (Story 07.12)
 * Purpose: Enter/confirm quantity with number pad
 * Features: Pre-fill with available qty, quick adjust buttons, validation
 *
 * States: loading, error, empty, success
 */

'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { NumberPad } from '../../shared/NumberPad'
import { LargeTouchButton } from '../../shared/LargeTouchButton'
import type { LPLookupResult } from '@/lib/hooks/use-scanner-pack'

interface Step4QuantityEntryProps {
  lp: LPLookupResult
  availableQty: number
  defaultQty: number
  allergenWarning?: boolean
  onConfirm: (quantity: number) => void
  onCancel: () => void
  className?: string
}

export function Step4QuantityEntry({
  lp,
  availableQty,
  defaultQty,
  allergenWarning = false,
  onConfirm,
  onCancel,
  className,
}: Step4QuantityEntryProps) {
  const [quantity, setQuantity] = useState(String(defaultQty))
  const [allergenAcknowledged, setAllergenAcknowledged] = useState(false)

  // Parse quantity
  const numQty = parseInt(quantity, 10) || 0
  const isValid = numQty > 0 && numQty <= availableQty
  const exceeds = numQty > availableQty

  // Check if can proceed
  const canProceed = isValid && (!allergenWarning || allergenAcknowledged)

  // Handle confirm
  const handleConfirm = () => {
    if (canProceed) {
      onConfirm(numQty)
    }
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* LP Details */}
      <div className="bg-white border-b p-4">
        <h3 className="font-semibold text-lg text-gray-900">{lp.productName}</h3>
        <p className="text-sm text-gray-500">Lot: {lp.lotNumber}</p>
        <p className="text-sm text-gray-500">LP: {lp.lpNumber}</p>
        <p className="text-sm font-medium text-green-600 mt-2">
          Available: {availableQty} {lp.uom}
        </p>
      </div>

      {/* Allergen Warning */}
      {allergenWarning && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">Allergen Alert</p>
              <p className="text-sm text-yellow-700 mt-1">
                This product contains allergens. Customer has allergen restrictions.
              </p>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="allergen-acknowledge"
                  checked={allergenAcknowledged}
                  onChange={(e) => setAllergenAcknowledged(e.target.checked)}
                  className="h-5 w-5 rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="text-sm text-yellow-800">
                  I acknowledge the allergen risk
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Input */}
      <div className="p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity to Pack
        </label>
        <Input
          data-testid="quantity-input"
          type="text"
          inputMode="numeric"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))}
          className={cn(
            'h-14 min-h-[56px] text-2xl text-center font-semibold',
            exceeds && 'border-red-500 text-red-600 bg-red-50'
          )}
          readOnly
        />
        {exceeds && (
          <p className="text-red-600 text-sm mt-1">
            Quantity exceeds available ({availableQty})
          </p>
        )}
      </div>

      {/* Number Pad */}
      <div className="flex-1 px-4 pb-4">
        <NumberPad
          data-testid="number-pad"
          value={quantity}
          onChange={setQuantity}
          maxValue={availableQty}
          allowDecimal={false}
        />
      </div>

      {/* Actions */}
      <div className="p-4 bg-white border-t space-y-3 safe-area-bottom">
        <LargeTouchButton
          size="full"
          variant="success"
          onClick={handleConfirm}
          disabled={!canProceed}
        >
          Add to Box
        </LargeTouchButton>

        <LargeTouchButton
          size="full"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default Step4QuantityEntry
