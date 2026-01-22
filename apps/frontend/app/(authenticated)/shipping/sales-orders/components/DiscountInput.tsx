/**
 * Discount Input Component
 * Story 07.4: SO Line Pricing
 *
 * Input for discount type and value:
 * - Percentage or Fixed discount
 * - Validation for non-negative values
 * - Percentage cap at 100%
 */

'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// =============================================================================
// Types
// =============================================================================

type DiscountType = 'percent' | 'fixed'

interface DiscountValue {
  type: DiscountType
  value: number
}

interface DiscountInputProps {
  value: DiscountValue | null
  onChange: (value: DiscountValue | null) => void
}

// =============================================================================
// Component
// =============================================================================

export function DiscountInput({ value, onChange }: DiscountInputProps) {
  const [discountType, setDiscountType] = useState<'none' | DiscountType>(
    value?.type || 'none'
  )
  const [discountValue, setDiscountValue] = useState<number>(value?.value || 0)
  const [error, setError] = useState<string | null>(null)

  // Only sync internal state when parent explicitly provides a non-null value
  // This allows the component to work in both controlled and uncontrolled modes
  useEffect(() => {
    if (value !== null && value !== undefined) {
      setDiscountType(value.type)
      setDiscountValue(value.value)
    }
    // Intentionally don't include value in deps to avoid resetting on null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.type, value?.value])

  const handleTypeChange = (type: string) => {
    setError(null)
    if (type === 'none') {
      setDiscountType('none')
      setDiscountValue(0)
      onChange(null)
    } else {
      const newType = type as DiscountType
      setDiscountType(newType)
      if (discountValue > 0) {
        // Validate and update
        if (newType === 'percent' && discountValue > 100) {
          setError('Percentage discount cannot exceed 100%')
        } else {
          onChange({ type: newType, value: discountValue })
        }
      }
    }
  }

  const handleValueChange = (newValue: number) => {
    setDiscountValue(newValue)
    setError(null)

    if (discountType === 'none') return

    // Validation
    if (newValue < 0) {
      setError('Discount cannot be negative')
      return
    }

    if (discountType === 'percent' && newValue > 100) {
      setError('Percentage discount cannot exceed 100%')
      return
    }

    onChange({ type: discountType, value: newValue })
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="discount-type">Discount Type</Label>
          <Select value={discountType} onValueChange={handleTypeChange}>
            <SelectTrigger id="discount-type" role="combobox" aria-label="Discount type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="percent">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {discountType !== 'none' && (
          <div>
            <Label htmlFor="discount-value">Discount Value</Label>
            <Input
              id="discount-value"
              type="number"
              step={discountType === 'percent' ? 1 : 0.01}
              value={discountValue}
              onChange={(e) => {
                const rawValue = e.target.value
                // Check for negative value (including when typing the minus sign)
                if (rawValue.includes('-') || rawValue.startsWith('-')) {
                  const numValue = parseFloat(rawValue)
                  if (!isNaN(numValue) && numValue < 0) {
                    setDiscountValue(numValue)
                    setError('Discount cannot be negative')
                    return
                  }
                }
                const numValue = parseFloat(rawValue)
                // Handle NaN case (empty or invalid input)
                if (isNaN(numValue)) {
                  setDiscountValue(0)
                  setError(null)
                  return
                }
                handleValueChange(numValue)
              }}
              aria-label="Discount value"
              className={error ? 'border-red-500' : ''}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default DiscountInput
