/**
 * Weight Entry Modal Component (Story 07.12)
 * Purpose: Enter weight and optional dimensions when closing box
 * Features: Number inputs, skip option, validation
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Scale, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LargeTouchButton } from '../../shared/LargeTouchButton'

interface WeightEntryModalProps {
  boxNumber: number
  estimatedWeight?: number
  onConfirm: (weight?: number, length?: number, width?: number, height?: number) => void
  onSkip: () => void
  onCancel: () => void
  className?: string
}

export function WeightEntryModal({
  boxNumber,
  estimatedWeight = 0,
  onConfirm,
  onSkip,
  onCancel,
  className,
}: WeightEntryModalProps) {
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Parse values
  const numWeight = parseFloat(weight) || 0
  const numLength = parseFloat(length) || undefined
  const numWidth = parseFloat(width) || undefined
  const numHeight = parseFloat(height) || undefined

  // Validate weight
  const isWeightValid = weight === '' || numWeight > 0

  // Handle confirm
  const handleConfirm = () => {
    if (weight && numWeight <= 0) {
      setError('Weight must be positive')
      return
    }

    setError(null)
    onConfirm(
      weight ? numWeight : undefined,
      numLength,
      numWidth,
      numHeight
    )
  }

  return (
    <div
      data-testid="weight-entry-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div className={cn(
        'w-full max-w-md bg-white rounded-lg shadow-xl',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg text-gray-900">
            Close Box {boxNumber}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Weight input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg) - Optional
            </label>
            <div className="relative">
              <Input
                data-testid="weight-input"
                type="number"
                inputMode="decimal"
                placeholder={`Estimated: ${estimatedWeight.toFixed(1)} kg`}
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value)
                  setError(null)
                }}
                className={cn(
                  'h-12 min-h-[48px] text-lg pr-10',
                  !isWeightValid && 'border-red-500'
                )}
                step="0.1"
                min="0"
              />
              <Scale className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* Dimensions (collapsed by default) */}
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
              Add dimensions (optional)
            </summary>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Length (cm)</label>
                <Input
                  data-testid="length-input"
                  type="number"
                  inputMode="numeric"
                  placeholder="60"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width (cm)</label>
                <Input
                  data-testid="width-input"
                  type="number"
                  inputMode="numeric"
                  placeholder="40"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height (cm)</label>
                <Input
                  data-testid="height-input"
                  type="number"
                  inputMode="numeric"
                  placeholder="30"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </details>
        </div>

        {/* Actions */}
        <div className="p-4 border-t space-y-3">
          <LargeTouchButton
            size="full"
            variant="success"
            onClick={handleConfirm}
          >
            Confirm Close
          </LargeTouchButton>

          <LargeTouchButton
            size="full"
            variant="secondary"
            onClick={onSkip}
          >
            Skip Weight
          </LargeTouchButton>

          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full h-10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export default WeightEntryModal
