/**
 * Short Pick Modal Component (Story 07.10)
 * Modal for capturing short pick reason and notes
 */

'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ShortPickData } from '@/lib/types/scanner-pick'

interface ShortPickModalProps {
  quantity_to_pick: number
  quantity_available: number
  onConfirm: (data: ShortPickData) => void
  onCancel: () => void
  className?: string
}

const SHORT_PICK_REASONS = [
  { value: 'insufficient_inventory', label: 'Insufficient Inventory' },
  { value: 'product_not_found', label: 'Product Not Found' },
  { value: 'product_damaged', label: 'Product Damaged' },
  { value: 'location_empty', label: 'Location Empty' },
  { value: 'other', label: 'Other' },
]

export function ShortPickModal({
  quantity_to_pick,
  quantity_available,
  onConfirm,
  onCancel,
  className,
}: ShortPickModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const isValid = reason !== '' && quantity_available > 0

  const handleConfirm = useCallback(() => {
    if (!isValid) return

    onConfirm({
      reason,
      notes: notes || undefined,
      quantity: quantity_available,
    })
  }, [reason, notes, quantity_available, isValid, onConfirm])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
        className
      )}
      role="dialog"
      aria-labelledby="short-pick-modal-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <h2
          id="short-pick-modal-title"
          className="text-xl font-bold text-gray-900 mb-4"
        >
          Short Pick
        </h2>

        {/* Quantity comparison */}
        <div className="flex justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">Expected</p>
            <p className="text-xl font-bold">{quantity_to_pick}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-xl font-bold text-amber-600">{quantity_available}</p>
          </div>
        </div>

        {/* Reason dropdown */}
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">
            Reason <span className="text-red-500">*</span>
          </span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 block w-full h-12 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            aria-required="true"
          >
            <option value="">Select a reason...</option>
            {SHORT_PICK_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        {/* Notes input */}
        <label className="block mb-6">
          <span className="text-sm font-medium text-gray-700">Notes (optional)</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            className="mt-1 block w-full h-12 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Additional notes..."
          />
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 h-12 min-h-[48px]"
            aria-label="Cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid}
            className="flex-1 h-12 min-h-[48px] bg-amber-500 hover:bg-amber-600 text-white"
            aria-label="Confirm Short Pick"
          >
            Confirm Short Pick
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ShortPickModal
