/**
 * Step 1: Scan WO Barcode (Story 04.6b)
 * Purpose: Scan or enter work order barcode
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScanBarcode, Keyboard } from 'lucide-react'

interface Step1ScanWOProps {
  onScan: (barcode: string) => void
  isLoading?: boolean
}

export function Step1ScanWO({ onScan, isLoading = false }: Step1ScanWOProps) {
  const [barcode, setBarcode] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmed = barcode.trim()
    if (trimmed) {
      onScan(trimmed)
    }
  }, [barcode, onScan])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan WO Barcode</h2>
        <p className="text-gray-500">Scan the work order barcode to begin</p>
      </div>

      {/* Scan icon */}
      <div className="flex items-center justify-center mb-8">
        <div className="w-[68px] h-[68px] flex items-center justify-center bg-slate-100 rounded-lg">
          <ScanBarcode className="w-12 h-12 text-slate-600" />
        </div>
      </div>

      {/* Barcode input */}
      <div className="mb-4">
        <Input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="WO-2025-0156"
          className={cn(
            'h-12 min-h-[48px] text-xl font-mono text-center',
            'border-2 focus:border-cyan-500'
          )}
          autoComplete="off"
          autoFocus
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowManualEntry(!showManualEntry)}
          className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
        >
          <Keyboard className="h-4 w-4" />
          Tap to type manually
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action bar */}
      <div className="pb-safe">
        <Button
          onClick={handleSubmit}
          disabled={!barcode.trim() || isLoading}
          className={cn(
            'w-full h-12 min-h-[48px] text-lg font-semibold',
            'bg-cyan-600 hover:bg-cyan-700 text-white'
          )}
        >
          {isLoading ? 'Scanning...' : 'Scan'}
        </Button>
        <p className="text-center text-sm text-gray-400 mt-2">or press Enter</p>
      </div>
    </div>
  )
}

export default Step1ScanWO
