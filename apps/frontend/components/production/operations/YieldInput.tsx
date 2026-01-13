'use client'

/**
 * YieldInput Component
 * Story: 04.3 - Operation Start/Complete
 *
 * Specialized input for yield percentage with slider and number input.
 * Includes color feedback based on yield range.
 */

import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface YieldInputProps {
  /** Current yield value (0-100) */
  value: number
  /** Callback when value changes */
  onChange: (value: number) => void
  /** Minimum value (default 0) */
  min?: number
  /** Maximum value (default 100) */
  max?: number
  /** Step increment (default 0.5) */
  step?: number
  /** Error message to display */
  error?: string
  /** Disable the input */
  disabled?: boolean
  /** Optional label text */
  label?: string
}

/**
 * Get color class based on yield range
 */
function getYieldColor(value: number): {
  slider: string
  indicator: string
  label: string
} {
  if (value >= 95) {
    return {
      slider: '[&_[role=slider]]:bg-green-500 [&_.range]:bg-green-500',
      indicator: 'text-green-600',
      label: 'Excellent',
    }
  }
  if (value >= 85) {
    return {
      slider: '[&_[role=slider]]:bg-blue-500 [&_.range]:bg-blue-500',
      indicator: 'text-blue-600',
      label: 'Good',
    }
  }
  if (value >= 70) {
    return {
      slider: '[&_[role=slider]]:bg-yellow-500 [&_.range]:bg-yellow-500',
      indicator: 'text-yellow-600',
      label: 'Below Target',
    }
  }
  return {
    slider: '[&_[role=slider]]:bg-red-500 [&_.range]:bg-red-500',
    indicator: 'text-red-600',
    label: 'Low Yield',
  }
}

export function YieldInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.5,
  error,
  disabled = false,
  label = 'Actual Yield (%)',
}: YieldInputProps) {
  const id = useId()
  const errorId = `${id}-error`
  const descriptionId = `${id}-description`
  const yieldColor = getYieldColor(value)

  const handleSliderChange = (newValue: number) => {
    onChange(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    if (rawValue === '') {
      onChange(0)
      return
    }
    const parsed = parseFloat(rawValue)
    if (!isNaN(parsed)) {
      // Clamp to valid range
      const clamped = Math.min(max, Math.max(min, parsed))
      onChange(clamped)
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} <span className="text-destructive">*</span>
      </Label>

      <div className="flex items-center gap-4">
        {/* Slider */}
        <div className="flex-1">
          <Slider
            id={id}
            value={value}
            onChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-describedby={error ? errorId : descriptionId}
            className={cn('w-full', yieldColor.slider)}
          />
        </div>

        {/* Number input */}
        <div className="w-24">
          <Input
            type="number"
            value={value.toFixed(1)}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={cn(
              'text-right',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
            aria-label={`${label} numeric input`}
          />
        </div>
      </div>

      {/* Range labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}%</span>
        <span className={cn('font-medium', yieldColor.indicator)}>
          {yieldColor.label}
        </span>
        <span>{max}%</span>
      </div>

      {/* Error message */}
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Screen reader description */}
      <p id={descriptionId} className="sr-only">
        Enter yield percentage between {min}% and {max}%. Current value: {value}
        %. Use slider or number input.
      </p>
    </div>
  )
}

export default YieldInput
