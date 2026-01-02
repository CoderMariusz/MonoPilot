/**
 * Discount Input Component
 * Story 03.4: PO Totals + Tax Calculations
 *
 * Toggle between percentage (%) and fixed amount ($) discount modes.
 * Validates that discount does not exceed the line/order total.
 *
 * States:
 * - Loading: Shows skeleton input
 * - Error: Shows error message
 * - Empty: Empty input field
 * - Success: Shows discount value with mode toggle
 *
 * Keyboard navigation:
 * - Tab: Focus input/toggle
 * - Enter/Space: Toggle mode
 * - Arrow keys: Adjust value
 */

'use client'

import { useState, useCallback, useEffect, useId } from 'react'
import { Percent, DollarSign, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export type DiscountMode = 'percent' | 'amount'

export interface DiscountInputProps {
  /** Current discount value */
  value: number
  /** Callback when value changes */
  onChange: (value: number, mode: DiscountMode) => void
  /** Current mode (percent or amount) */
  mode: DiscountMode
  /** Maximum allowed discount (line_total for validation) */
  max: number
  /** Currency code for amount mode display */
  currency?: string
  /** Label for the input */
  label?: string
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Disabled state */
  disabled?: boolean
  /** Additional class names */
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

const formatPercentValue = (value: number): string => {
  if (value === 0) return ''
  return value.toString()
}

const formatAmountValue = (value: number): string => {
  if (value === 0) return ''
  return value.toFixed(2)
}

const parseInputValue = (input: string): number => {
  const parsed = parseFloat(input)
  return isNaN(parsed) ? 0 : parsed
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-16" />
      <div className="flex gap-1">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DiscountInput({
  value,
  onChange,
  mode,
  max,
  currency = 'USD',
  label = 'Discount',
  isLoading = false,
  error = null,
  disabled = false,
  className,
}: DiscountInputProps) {
  const inputId = useId()
  const [localValue, setLocalValue] = useState<string>(
    mode === 'percent' ? formatPercentValue(value) : formatAmountValue(value)
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  // Sync local value when mode or external value changes
  useEffect(() => {
    setLocalValue(mode === 'percent' ? formatPercentValue(value) : formatAmountValue(value))
  }, [value, mode])

  // Validate and emit change
  const handleValueChange = useCallback(
    (inputValue: string) => {
      setLocalValue(inputValue)
      const parsedValue = parseInputValue(inputValue)

      // Validate based on mode
      if (mode === 'percent') {
        if (parsedValue < 0) {
          setValidationError('Discount cannot be negative')
          return
        }
        if (parsedValue > 100) {
          setValidationError('Discount cannot exceed 100%')
          return
        }
        // Calculate the actual discount amount and check against max
        const discountAmount = (max * parsedValue) / 100
        if (discountAmount > max) {
          setValidationError(`Discount cannot exceed ${currency} ${max.toFixed(2)}`)
          return
        }
      } else {
        // Amount mode
        if (parsedValue < 0) {
          setValidationError('Discount cannot be negative')
          return
        }
        if (parsedValue > max) {
          setValidationError(`Discount cannot exceed ${currency} ${max.toFixed(2)}`)
          return
        }
      }

      setValidationError(null)
      onChange(parsedValue, mode)
    },
    [mode, max, currency, onChange]
  )

  // Toggle mode
  const handleModeToggle = useCallback(() => {
    const newMode: DiscountMode = mode === 'percent' ? 'amount' : 'percent'

    // Convert value to new mode
    let newValue = 0
    if (mode === 'percent' && value > 0 && max > 0) {
      // Convert percent to amount
      newValue = (max * value) / 100
    } else if (mode === 'amount' && value > 0 && max > 0) {
      // Convert amount to percent
      newValue = (value / max) * 100
    }

    setValidationError(null)
    onChange(newValue, newMode)
  }, [mode, value, max, onChange])

  // Handle blur - format value
  const handleBlur = useCallback(() => {
    const parsedValue = parseInputValue(localValue)
    if (mode === 'percent') {
      setLocalValue(formatPercentValue(parsedValue))
    } else {
      setLocalValue(formatAmountValue(parsedValue))
    }
  }, [localValue, mode])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return

      // Arrow keys for value adjustment
      const step = mode === 'percent' ? 1 : 0.5
      const currentValue = parseInputValue(localValue)

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        handleValueChange(String(currentValue + step))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        handleValueChange(String(Math.max(0, currentValue - step)))
      }
    },
    [disabled, mode, localValue, handleValueChange]
  )

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton className={className} />
  }

  const hasError = error || validationError
  const errorMessage = error || validationError

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label
          htmlFor={inputId}
          className={cn(hasError && 'text-destructive')}
        >
          {label}
        </Label>
      )}

      <div className="flex gap-1">
        {/* Input field */}
        <div className="relative flex-1">
          <Input
            id={inputId}
            type="number"
            inputMode="decimal"
            min={0}
            max={mode === 'percent' ? 100 : max}
            step={mode === 'percent' ? 1 : 0.01}
            value={localValue}
            onChange={(e) => handleValueChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={mode === 'percent' ? '0' : '0.00'}
            className={cn(
              'pr-8',
              hasError && 'border-destructive focus-visible:ring-destructive'
            )}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
          />
          {/* Unit indicator inside input */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {mode === 'percent' ? '%' : currency}
          </span>
        </div>

        {/* Mode toggle button group */}
        <div
          className="flex rounded-md border"
          role="group"
          aria-label="Discount mode"
        >
          <Button
            type="button"
            variant={mode === 'percent' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'h-9 w-9 p-0 rounded-r-none border-0',
              mode === 'percent' && 'bg-primary text-primary-foreground'
            )}
            onClick={() => mode !== 'percent' && handleModeToggle()}
            disabled={disabled}
            aria-pressed={mode === 'percent'}
            aria-label="Percentage mode"
          >
            <Percent className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={mode === 'amount' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'h-9 w-9 p-0 rounded-l-none border-0 border-l',
              mode === 'amount' && 'bg-primary text-primary-foreground'
            )}
            onClick={() => mode !== 'amount' && handleModeToggle()}
            disabled={disabled}
            aria-pressed={mode === 'amount'}
            aria-label="Amount mode"
          >
            <DollarSign className="h-4 w-4" />
          </Button>
        </div>
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

      {/* Helper text showing calculated value */}
      {!hasError && value > 0 && max > 0 && (
        <p className="text-xs text-muted-foreground">
          {mode === 'percent'
            ? `Discount amount: ${currency} ${((max * value) / 100).toFixed(2)}`
            : `Discount percentage: ${((value / max) * 100).toFixed(1)}%`}
        </p>
      )}
    </div>
  )
}

export default DiscountInput
