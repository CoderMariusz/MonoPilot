/**
 * Scan WO Step Component (Story 04.7b)
 * Purpose: Step 1 - Scan WO barcode
 * Features: Auto-focus, 500ms validation, success/error states
 *
 * BUG-098: Fixed button ARIA state to match disabled state
 * BUG-100: Added input validation for security (alphanumeric + hyphens/underscores)
 * BUG-102: Communicated max length (50 chars) in hint and via maxLength attr
 * BUG-103: Clarified "Tap to type manually" with better wording and click handler
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { ErrorAnimation } from '../shared/ErrorAnimation'
import { Camera, Loader2 } from 'lucide-react'
import { AudioFeedback } from '../shared/AudioFeedback'
import { HapticFeedback } from '../shared/HapticFeedback'
import type { WizardError } from '@/lib/hooks/use-scanner-output'

// WO barcode validation: alphanumeric, hyphens, underscores only (common barcode chars)
const WO_PATTERN = /^[A-Za-z0-9\-_]+$/
const MAX_WO_LENGTH = 50

function validateWOInput(value: string): { isValid: boolean; error?: string } {
  if (!value.trim()) {
    return { isValid: false }
  }
  if (value.length > MAX_WO_LENGTH) {
    return { isValid: false, error: `WO code too long (max ${MAX_WO_LENGTH} characters)` }
  }
  if (!WO_PATTERN.test(value)) {
    return { isValid: false, error: 'WO code can only contain letters, numbers, hyphens, and underscores' }
  }
  return { isValid: true }
}

interface ScanWOStepProps {
  onScan: (barcode: string) => Promise<void>
  error: WizardError | null
  onClearError: () => void
}

export function ScanWOStep({ onScan, error, onClearError }: ScanWOStepProps) {
  const [barcode, setBarcode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Handle input change with validation
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBarcode(value)
    
    // Clear validation error when input is empty
    if (!value.trim()) {
      setValidationError(null)
      return
    }
    
    // Validate input
    const { error: valError } = validateWOInput(value)
    setValidationError(valError || null)
  }, [])

  // Handle scan with validation
  const handleScan = useCallback(async () => {
    const trimmed = barcode.trim()
    if (!trimmed || isLoading) return

    // Validate before submitting
    const { isValid, error: valError } = validateWOInput(trimmed)
    if (!isValid) {
      setValidationError(valError || 'Invalid WO code')
      AudioFeedback.playError()
      HapticFeedback.error()
      return
    }

    setValidationError(null)
    setIsLoading(true)
    onClearError()

    try {
      await onScan(trimmed)
    } finally {
      setIsLoading(false)
    }
  }, [barcode, isLoading, onScan, onClearError])

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      handleScan()
    },
    [handleScan]
  )

  // Handle manual entry - focus and select input for typing
  const handleManualEntry = useCallback(() => {
    setBarcode('')
    setValidationError(null)
    onClearError()
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [onClearError])

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900">
        <ErrorAnimation show message={error.message} />
        <p className="text-slate-300 text-center mt-4 mb-2">
          {error.code === 'INVALID_BARCODE' && 'Invalid barcode format'}
          {error.code === 'WO_NOT_FOUND' && 'Work order not found'}
          {error.code === 'INVALID_WO' && error.message}
        </p>
        <p className="text-slate-500 text-sm text-center mb-8">
          Possible reasons:
          <br />- WO does not exist
          <br />- WO is not started
          <br />- WO is already completed
        </p>
        <div className="flex gap-4 w-full max-w-sm">
          <LargeTouchButton
            variant="secondary"
            size="full"
            onClick={handleManualEntry}
            className="flex-1"
          >
            Scan Again
          </LargeTouchButton>
          <LargeTouchButton
            variant="secondary"
            size="full"
            onClick={handleManualEntry}
            className="flex-1"
          >
            Manual Entry
          </LargeTouchButton>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-white text-lg">Looking up {barcode}...</p>
        <p className="text-slate-400 text-sm mt-2">Fetching product details...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-900">
      <h2 className="text-2xl font-bold text-white mb-6">Scan WO Barcode</h2>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Barcode icon */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
            <Camera className="w-12 h-12 text-slate-600" />
          </div>

          {/* Scan input */}
          <div className="w-full max-w-sm">
            <label htmlFor="barcode-input" className="sr-only">
              Work Order Barcode
            </label>
            <input
              ref={inputRef}
              id="barcode-input"
              type="text"
              value={barcode}
              onChange={handleInputChange}
              placeholder="WO-2025-0001"
              maxLength={MAX_WO_LENGTH}
              className={cn(
                'w-full h-12 px-4 text-2xl font-mono text-center',
                'bg-slate-800 border-2 rounded-lg',
                'text-white placeholder-slate-500',
                'focus:border-cyan-500 focus:outline-none',
                validationError ? 'border-red-500' : 'border-slate-700'
              )}
              inputMode="none"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-describedby="barcode-hint barcode-error"
              aria-invalid={!!validationError}
              data-testid="barcode-input"
            />
            {validationError ? (
              <p id="barcode-error" className="text-red-400 text-center text-sm mt-2" role="alert">
                {validationError}
              </p>
            ) : (
              <button
                type="button"
                id="barcode-hint"
                onClick={handleManualEntry}
                className="w-full text-slate-400 text-center text-sm mt-2 hover:text-cyan-400 transition-colors cursor-pointer"
                title="Click to focus the input field and type the WO code manually"
              >
                Type WO code manually (max {MAX_WO_LENGTH} chars)
              </button>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="pt-4">
          <LargeTouchButton
            type="submit"
            variant="primary"
            size="full"
            disabled={!barcode.trim() || !!validationError}
            aria-disabled={!barcode.trim() || !!validationError}
          >
            {barcode.trim() && !validationError ? 'Validate WO' : 'Enter WO code to continue'}
          </LargeTouchButton>
        </div>
      </form>
    </div>
  )
}

export default ScanWOStep
