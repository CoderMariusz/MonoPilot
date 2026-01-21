/**
 * Scan WO Step Component (Story 04.7b)
 * Purpose: Step 1 - Scan WO barcode
 * Features: Auto-focus, 500ms validation, success/error states
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { SuccessAnimation } from '../shared/SuccessAnimation'
import { ErrorAnimation } from '../shared/ErrorAnimation'
import { Camera, Loader2 } from 'lucide-react'
import type { WizardError } from '@/lib/hooks/use-scanner-output'

interface ScanWOStepProps {
  onScan: (barcode: string) => Promise<void>
  error: WizardError | null
  onClearError: () => void
}

export function ScanWOStep({ onScan, error, onClearError }: ScanWOStepProps) {
  const [barcode, setBarcode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Handle scan
  const handleScan = useCallback(async () => {
    if (!barcode.trim() || isLoading) return

    setIsLoading(true)
    onClearError()

    try {
      await onScan(barcode.trim())
    } finally {
      setIsLoading(false)
    }
  }, [barcode, isLoading, onScan, onClearError])

  // Handle key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleScan()
      }
    },
    [handleScan]
  )

  // Handle manual entry
  const handleManualEntry = useCallback(() => {
    setBarcode('')
    onClearError()
    if (inputRef.current) {
      inputRef.current.focus()
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

      {/* Barcode icon */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
          <Camera className="w-12 h-12 text-slate-600" />
        </div>

        {/* Scan input */}
        <div className="w-full max-w-sm">
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="WO-2025-0001"
            className={cn(
              'w-full h-12 px-4 text-2xl font-mono text-center',
              'bg-slate-800 border-2 border-slate-700 rounded-lg',
              'text-white placeholder-slate-500',
              'focus:border-cyan-500 focus:outline-none'
            )}
            inputMode="none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-testid="barcode-input"
          />
          <p className="text-slate-400 text-center text-sm mt-2">
            Tap to type manually
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="pt-4">
        <LargeTouchButton
          variant="primary"
          size="full"
          onClick={handleScan}
          disabled={!barcode.trim()}
        >
          {barcode.trim() ? 'Scan' : 'Scan or press Enter'}
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default ScanWOStep
