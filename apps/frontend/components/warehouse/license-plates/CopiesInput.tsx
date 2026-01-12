/**
 * Copies Input Component (Story 05.14)
 * Purpose: Number input with +/- buttons for label copies
 *
 * AC Coverage:
 * - AC-11: Validate copies 1-100
 */

'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface CopiesInputProps {
  value: number
  onChange: (value: number) => void
  label?: string
  min?: number
  max?: number
  error?: string
  disabled?: boolean
  className?: string
}

export function CopiesInput({
  value,
  onChange,
  label = 'Copies',
  min = 1,
  max = 100,
  error,
  disabled = false,
  className,
}: CopiesInputProps) {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="copies-input" className="text-sm font-medium">
          {label}
        </Label>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label="Decrease copies"
          className="h-9 w-9"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Input
          id="copies-input"
          type="number"
          role="spinbutton"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          disabled={disabled}
          className={cn(
            'w-20 text-center',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? 'copies-error' : undefined}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          aria-label="Increase copies"
          className="h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <p id="copies-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
