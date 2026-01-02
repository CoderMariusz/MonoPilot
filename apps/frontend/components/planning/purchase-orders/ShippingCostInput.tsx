/**
 * Shipping Cost Input Component
 * Story 03.4: PO Totals + Tax Calculations
 *
 * Currency input field for entering shipping costs on purchase orders.
 * Validates that shipping cost is >= 0.
 *
 * States:
 * - Loading: Shows skeleton input
 * - Error: Shows error message
 * - Empty: Empty input field with placeholder
 * - Success: Shows shipping cost value
 *
 * Keyboard navigation:
 * - Tab: Focus input
 * - Arrow keys: Adjust value by step
 */

'use client'

import { useState, useCallback, useEffect, useId } from 'react'
import { Truck, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Currency } from '@/lib/types/purchase-order'

// ============================================================================
// TYPES
// ============================================================================

export interface ShippingCostInputProps {
  /** Current shipping cost value */
  value: number
  /** Callback when value changes */
  onChange: (value: number) => void
  /** Currency code for display */
  currency: Currency
  /** Label for the input */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Disabled state */
  disabled?: boolean
  /** Maximum allowed shipping cost */
  max?: number
  /** Step increment for keyboard navigation */
  step?: number
  /** Show icon prefix */
  showIcon?: boolean
  /** Additional class names */
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

const formatValue = (value: number): string => {
  if (value === 0) return ''
  return value.toFixed(2)
}

const parseInputValue = (input: string): number => {
  const parsed = parseFloat(input)
  return isNaN(parsed) ? 0 : parsed
}

// Get currency symbol
const getCurrencySymbol = (currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    PLN: 'zl',
    EUR: 'EUR',
    USD: '$',
    GBP: 'GBP',
  }
  return symbols[currency] || currency
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full" />
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ShippingCostInput({
  value,
  onChange,
  currency,
  label = 'Shipping Cost',
  placeholder = '0.00',
  isLoading = false,
  error = null,
  disabled = false,
  max = 999999.99,
  step = 1,
  showIcon = true,
  className,
}: ShippingCostInputProps) {
  const inputId = useId()
  const [localValue, setLocalValue] = useState<string>(formatValue(value))
  const [validationError, setValidationError] = useState<string | null>(null)

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(formatValue(value))
  }, [value])

  // Validate and emit change
  const handleValueChange = useCallback(
    (inputValue: string) => {
      setLocalValue(inputValue)
      const parsedValue = parseInputValue(inputValue)

      // Validate
      if (parsedValue < 0) {
        setValidationError('Shipping cost cannot be negative')
        return
      }
      if (parsedValue > max) {
        setValidationError(`Shipping cost cannot exceed ${getCurrencySymbol(currency)} ${max.toFixed(2)}`)
        return
      }

      setValidationError(null)
      onChange(parsedValue)
    },
    [max, currency, onChange]
  )

  // Handle blur - format value
  const handleBlur = useCallback(() => {
    const parsedValue = parseInputValue(localValue)
    setLocalValue(formatValue(parsedValue))
  }, [localValue])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return

      const currentValue = parseInputValue(localValue)

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        handleValueChange(String(Math.min(currentValue + step, max)))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        handleValueChange(String(Math.max(0, currentValue - step)))
      }
    },
    [disabled, localValue, step, max, handleValueChange]
  )

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton className={className} />
  }

  const hasError = error || validationError
  const errorMessage = error || validationError
  const currencySymbol = getCurrencySymbol(currency)

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label
          htmlFor={inputId}
          className={cn(
            'flex items-center gap-1.5',
            hasError && 'text-destructive'
          )}
        >
          {showIcon && <Truck className="h-4 w-4 text-muted-foreground" />}
          {label}
        </Label>
      )}

      <div className="relative">
        {/* Currency prefix */}
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          {currencySymbol}
        </span>

        <Input
          id={inputId}
          type="number"
          inputMode="decimal"
          min={0}
          max={max}
          step={0.01}
          value={localValue}
          onChange={(e) => handleValueChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-14 tabular-nums',
            hasError && 'border-destructive focus-visible:ring-destructive'
          )}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
        />

        {/* Currency code suffix */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          {currency}
        </span>
      </div>

      {/* Error message */}
      {hasError && (
        <div
          id={`${inputId}-error`}
          className="flex items-center gap-1.5 text-xs text-destructive"
          role="alert"
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}

export default ShippingCostInput
