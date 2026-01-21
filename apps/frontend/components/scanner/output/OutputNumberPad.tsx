/**
 * Output Number Pad Component (Story 04.7b)
 * Purpose: Touch-friendly number pad for quantity entry
 * Features: 64x64dp keys, decimal support (2 places), clear/backspace
 */

'use client'

import { cn } from '@/lib/utils'
import { Delete, X } from 'lucide-react'

interface OutputNumberPadProps {
  value: string
  onChange: (value: string) => void
  maxDecimalPlaces?: number
  disabled?: boolean
  className?: string
}

export function OutputNumberPad({
  value,
  onChange,
  maxDecimalPlaces = 2,
  disabled = false,
  className,
}: OutputNumberPadProps) {
  const handleDigit = (digit: string) => {
    if (disabled) return

    // Handle decimal rules
    if (digit === '.') {
      // Prevent multiple decimals
      if (value.includes('.')) return
      // Add leading zero if starting with decimal
      const newValue = value === '' ? '0.' : value + '.'
      onChange(newValue)
      return
    }

    // Handle 00 key
    if (digit === '00') {
      if (value === '' || value === '0') {
        onChange('0')
        return
      }
      // Check decimal places
      const decimalIndex = value.indexOf('.')
      if (decimalIndex !== -1) {
        const currentDecimals = value.length - decimalIndex - 1
        if (currentDecimals >= maxDecimalPlaces) return
        if (currentDecimals + 2 > maxDecimalPlaces) {
          onChange(value + '0')
          return
        }
      }
      onChange(value + '00')
      return
    }

    // Check decimal place limit
    const decimalIndex = value.indexOf('.')
    if (decimalIndex !== -1) {
      const currentDecimals = value.length - decimalIndex - 1
      if (currentDecimals >= maxDecimalPlaces) return
    }

    // Prevent leading zeros (except for decimals)
    if (value === '0' && digit !== '.') {
      onChange(digit)
      return
    }

    onChange(value + digit)
  }

  const handleBackspace = () => {
    if (disabled) return
    onChange(value.slice(0, -1))
  }

  const handleClear = () => {
    if (disabled) return
    onChange('')
  }

  const keyClass = cn(
    'w-16 h-16 min-w-[64px] min-h-[64px]', // 64x64dp
    'flex items-center justify-center',
    'bg-slate-700 rounded-lg',
    'text-white text-2xl font-semibold',
    'transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-cyan-500',
    disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:bg-slate-600 active:bg-slate-500'
  )

  return (
    <div
      className={cn('w-full', disabled && 'opacity-50', className)}
      aria-disabled={disabled}
      role="group"
      aria-label="Number pad"
      data-testid="number-pad"
    >
      {/* Display */}
      <div data-testid="display" className="sr-only">{value}</div>

      {/* Number pad grid */}
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
        {/* Row 1 */}
        <button
          type="button"
          className={keyClass}
          onClick={() => handleDigit('7')}
          disabled={disabled}
          data-testid="key-7"
        >
          7
        </button>
        <button
          type="button"
          className={keyClass}
          onClick={() => handleDigit('8')}
          disabled={disabled}
          data-testid="key-8"
        >
          8
        </button>
        <button
          type="button"
          className={keyClass}
          onClick={() => handleDigit('9')}
          disabled={disabled}
          data-testid="key-9"
        >
          9
        </button>
        <button
          type="button"
          className={keyClass}
          onClick={handleBackspace}
          disabled={disabled}
          aria-label="Backspace"
          data-testid="key-backspace"
        >
          <Delete className="w-6 h-6" aria-hidden="true" />
          <span aria-label="Backspace" className="sr-only">Backspace</span>
        </button>

        {/* Row 2 */}
        <button
          type="button"
          className={keyClass}
          onClick={() => handleDigit('4')}
          disabled={disabled}
          data-testid="key-4"
        >
          4
        </button>
        <button
          type="button"
          className={keyClass}
          onClick={() => handleDigit('5')}
          disabled={disabled}
          data-testid="key-5"
        >
          5
        </button>
        <button
          type="button"
          className={keyClass}
          onClick={() => handleDigit('6')}
          disabled={disabled}
          data-testid="key-6"
        >
          6
        </button>
        <button
          type="button"
          className={cn(keyClass, 'bg-red-900/50 hover:bg-red-800/50 active:bg-red-700/50')}
          onClick={handleClear}
          disabled={disabled}
          data-testid="key-clear"
        >
          C
        </button>

        {/* Row 3 */}
        <button
          type="button"
          className={keyClass}
          onClick={() => handleDigit('1')}
          disabled={disabled}
          data-testid="key-1"
        >
          1
        </button>
        <button
          type="button"
          className={keyClass}
          onClick={() => handleDigit('2')}
          disabled={disabled}
          data-testid="key-2"
        >
          2
        </button>
        <button
          type="button"
          className={keyClass}
          onClick={() => handleDigit('3')}
          disabled={disabled}
          data-testid="key-3"
        >
          3
        </button>
        <button
          type="button"
          className={keyClass}
          onClick={() => handleDigit('.')}
          disabled={disabled}
          data-testid="key-."
        >
          .
        </button>

        {/* Row 4 */}
        <button
          type="button"
          className={cn(keyClass, 'col-span-2')}
          onClick={() => handleDigit('0')}
          disabled={disabled}
          data-testid="key-0"
        >
          0
        </button>
        <button
          type="button"
          className={cn(keyClass, 'col-span-2')}
          onClick={() => handleDigit('00')}
          disabled={disabled}
          data-testid="key-00"
        >
          00
        </button>
      </div>
    </div>
  )
}

export default OutputNumberPad
