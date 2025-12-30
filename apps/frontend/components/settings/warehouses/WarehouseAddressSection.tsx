/**
 * WarehouseAddressSection Component
 * Story: 01.8 - Warehouses CRUD
 *
 * Multi-line address input with character counter
 * Max 500 characters, red counter when approaching limit
 */

'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface WarehouseAddressSectionProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

const MAX_CHARS = 500
const WARNING_THRESHOLD = 450

export function WarehouseAddressSection({
  value,
  onChange,
  error,
  disabled = false,
}: WarehouseAddressSectionProps) {
  const charCount = value?.length || 0
  const isNearLimit = charCount > WARNING_THRESHOLD
  const isOverLimit = charCount > MAX_CHARS

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    // Allow typing but show error if over limit
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="address">Address</Label>
      <Textarea
        id="address"
        value={value}
        onChange={handleChange}
        placeholder="Enter warehouse address..."
        rows={3}
        className={error || isOverLimit ? 'border-destructive' : ''}
        disabled={disabled}
        aria-describedby="address-counter address-error"
        maxLength={MAX_CHARS}
      />
      <div className="flex justify-between items-center">
        <p
          id="address-counter"
          className={`text-sm ${
            isOverLimit
              ? 'text-destructive font-medium'
              : isNearLimit
                ? 'text-orange-600'
                : 'text-muted-foreground'
          }`}
          aria-live="polite"
        >
          {charCount}/{MAX_CHARS} characters
        </p>
        {error && (
          <p id="address-error" className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
