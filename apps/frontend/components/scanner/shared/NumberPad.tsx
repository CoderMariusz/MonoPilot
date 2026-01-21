/**
 * Number Pad Component (Story 05.19)
 * Purpose: Touch-friendly number pad for quantity entry
 * Features: 48dp+ keys, decimal support, quick adjust buttons
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Delete, X } from 'lucide-react'

interface NumberPadProps {
  value: string
  onChange: (value: string) => void
  allowDecimal?: boolean
  maxValue?: number
  onQuickAdjust?: (delta: number) => void
  className?: string
  /** When true, all keys are non-interactive (for consume_whole_lp=true) */
  disabled?: boolean
}

export function NumberPad({
  value,
  onChange,
  allowDecimal = true,
  maxValue,
  onQuickAdjust,
  className,
  disabled = false,
}: NumberPadProps) {
  const handleDigit = (digit: string) => {
    if (disabled) return

    const newValue = value + digit

    // Prevent multiple decimals
    if (digit === '.' && value.includes('.')) return

    // Check max value if specified
    if (maxValue !== undefined) {
      const numValue = parseFloat(newValue)
      if (!isNaN(numValue) && numValue > maxValue) return
    }

    onChange(newValue)
  }

  const handleBackspace = () => {
    if (disabled) return
    if (value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const handleClear = () => {
    if (disabled) return
    onChange('')
  }

  const handleQuickAdjust = (delta: number) => {
    if (disabled) return
    if (onQuickAdjust) {
      onQuickAdjust(delta)
    } else {
      const currentValue = parseFloat(value) || 0
      const newValue = Math.max(0, currentValue + delta)
      if (maxValue !== undefined && newValue > maxValue) return
      onChange(String(newValue))
    }
  }

  const digitClass = cn(
    'h-12 min-h-[48px] w-full text-xl font-semibold',
    disabled
      ? 'opacity-50 cursor-not-allowed hover:bg-transparent active:bg-transparent'
      : 'hover:bg-gray-100 active:bg-gray-200'
  )
  const adjustClass = cn(
    'h-12 min-h-[48px] w-full text-lg font-semibold text-blue-600',
    disabled
      ? 'opacity-50 cursor-not-allowed hover:bg-transparent active:bg-transparent'
      : 'hover:bg-blue-50 active:bg-blue-100'
  )

  return (
    <div
      className={cn('w-full max-w-md mx-auto', disabled && 'opacity-50', className)}
      aria-disabled={disabled}
      role="group"
      aria-label="Number pad"
    >
      {/* Main grid: 4 columns (0-9 + decimal + backspace + quick adjusts) */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {/* Row 1 */}
        <Button variant="outline" className={digitClass} onClick={() => handleDigit('1')}>
          1
        </Button>
        <Button variant="outline" className={digitClass} onClick={() => handleDigit('2')}>
          2
        </Button>
        <Button variant="outline" className={digitClass} onClick={() => handleDigit('3')}>
          3
        </Button>
        <Button variant="outline" className={adjustClass} onClick={() => handleQuickAdjust(1)}>
          +1
        </Button>

        {/* Row 2 */}
        <Button variant="outline" className={digitClass} onClick={() => handleDigit('4')}>
          4
        </Button>
        <Button variant="outline" className={digitClass} onClick={() => handleDigit('5')}>
          5
        </Button>
        <Button variant="outline" className={digitClass} onClick={() => handleDigit('6')}>
          6
        </Button>
        <Button variant="outline" className={adjustClass} onClick={() => handleQuickAdjust(10)}>
          +10
        </Button>

        {/* Row 3 */}
        <Button variant="outline" className={digitClass} onClick={() => handleDigit('7')}>
          7
        </Button>
        <Button variant="outline" className={digitClass} onClick={() => handleDigit('8')}>
          8
        </Button>
        <Button variant="outline" className={digitClass} onClick={() => handleDigit('9')}>
          9
        </Button>
        <Button variant="outline" className={adjustClass} onClick={() => handleQuickAdjust(-1)}>
          -1
        </Button>

        {/* Row 4 */}
        {allowDecimal ? (
          <Button variant="outline" className={digitClass} onClick={() => handleDigit('.')}>
            .
          </Button>
        ) : (
          <div className="h-12" />
        )}
        <Button variant="outline" className={digitClass} onClick={() => handleDigit('0')}>
          0
        </Button>
        <Button
          variant="outline"
          className={digitClass}
          onClick={handleBackspace}
          aria-label="backspace"
        >
          <Delete className="h-5 w-5" />
        </Button>
        <Button variant="outline" className={adjustClass} onClick={() => handleQuickAdjust(-10)}>
          -10
        </Button>
      </div>

      {/* Clear button */}
      <div className="mt-2">
        <Button
          variant="outline"
          className="w-full h-12 min-h-[48px] text-lg font-semibold text-red-600 hover:bg-red-50 active:bg-red-100"
          onClick={handleClear}
        >
          <X className="h-5 w-5 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  )
}

export default NumberPad
