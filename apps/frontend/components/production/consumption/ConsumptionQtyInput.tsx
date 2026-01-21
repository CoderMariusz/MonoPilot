/**
 * ConsumptionQtyInput Component (Story 04.6c)
 * Quantity input component with editable/read-only states for consumption
 *
 * Features:
 * - Editable state: Slate-600 border, Slate-800 bg, text cursor
 * - Read-only state: Yellow-600 border, Slate-900 bg, lock icon, not-allowed cursor
 * - Pre-fills value when LP selected for consume_whole_lp materials
 * - Prevents editing when isReadOnly=true
 */

'use client'

import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export interface ConsumptionQtyInputProps {
  /** Current quantity value */
  value: number
  /** Callback when value changes */
  onChange: (value: number) => void
  /** Unit of measure to display */
  uom: string
  /** Maximum allowed quantity */
  maxQty: number
  /** Whether the input is read-only (for consume_whole_lp=true) */
  isReadOnly: boolean
  /** Whether to show the lock icon */
  showLockIcon: boolean
  /** ID for the warning message element (for aria-describedby) */
  warningId?: string
  /** Additional CSS classes for the container */
  className?: string
}

export function ConsumptionQtyInput({
  value,
  onChange,
  uom,
  maxQty,
  isReadOnly,
  showLockIcon,
  warningId,
  className,
}: ConsumptionQtyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return

    const newValue = parseFloat(e.target.value)

    // Don't allow negative values
    if (newValue < 0) return

    // Don't allow values greater than maxQty
    if (!isNaN(newValue) && newValue > maxQty) {
      onChange(maxQty)
      return
    }

    if (!isNaN(newValue)) {
      onChange(newValue)
    } else if (e.target.value === '') {
      onChange(0)
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Input
          type="number"
          value={value}
          onChange={handleChange}
          readOnly={isReadOnly}
          aria-label="Consumption quantity"
          aria-readonly={isReadOnly}
          aria-describedby={isReadOnly && warningId ? warningId : undefined}
          min={0}
          max={maxQty}
          step="0.001"
          className={cn(
            'font-mono pr-10',
            isReadOnly
              ? 'border-yellow-600 bg-slate-900 cursor-not-allowed'
              : 'border-slate-600 bg-slate-800 cursor-text'
          )}
        />
        {showLockIcon && isReadOnly && (
          <Lock
            data-testid="lock-icon"
            aria-hidden="true"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-600"
          />
        )}
      </div>
      <div className="flex items-center px-3 bg-muted rounded-md text-sm min-w-[60px] justify-center">
        {uom}
      </div>
    </div>
  )
}

export default ConsumptionQtyInput
