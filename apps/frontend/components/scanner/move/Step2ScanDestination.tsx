/**
 * Step 2: Scan Destination Component (Story 05.20)
 * Purpose: Scan or select destination location
 * Features: LP summary, location scan, manual selection, capacity warning
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Scan, Keyboard, CheckCircle2, XCircle, AlertTriangle, MapPin } from 'lucide-react'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { LPSummaryCard } from './LPSummaryCard'
import { Badge } from '@/components/ui/badge'
import type { LPLookupResult, LocationLookupResult } from '@/lib/validation/scanner-move'

interface Step2ScanDestinationProps {
  lp: LPLookupResult
  onLocationScanned: (barcode: string) => void
  onBack: () => void
  onError: (message: string) => void
  scannedLocation?: LocationLookupResult
  error?: string
  warning?: string
}

export function Step2ScanDestination({
  lp,
  onLocationScanned,
  onBack,
  onError,
  scannedLocation,
  error,
  warning,
}: Step2ScanDestinationProps) {
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when manual entry is enabled
  useEffect(() => {
    if (isManualEntry && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isManualEntry])

  const handleScan = () => {
    // In real implementation, this would trigger barcode scanner
    // For now, show manual entry
    setIsManualEntry(true)
  }

  const handleManualSubmit = () => {
    const barcode = manualInput.trim()
    if (barcode) {
      onLocationScanned(barcode)
    } else {
      onError('Please enter a location code')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit()
    }
    if (e.key === 'Escape') {
      setIsManualEntry(false)
      setManualInput('')
    }
  }

  // Show location details after successful scan
  if (scannedLocation) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
        {/* LP Summary (compact) */}
        <LPSummaryCard lp={lp} compact />

        {/* Current Location */}
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <MapPin className="h-4 w-4" />
            <span>From (Current Location)</span>
          </div>
          <div className="font-medium text-gray-900">{lp.location.code}</div>
          <div className="text-sm text-gray-500">{lp.location.path}</div>
        </div>

        {/* Success indicator */}
        <div className="flex items-center justify-center py-2">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>

        {/* Destination Details */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
            <MapPin className="h-4 w-4" />
            <span>To (Destination)</span>
          </div>
          <div className="font-bold text-lg text-gray-900">{scannedLocation.location_code}</div>
          <div className="text-sm text-gray-600 mt-1">{scannedLocation.location_path}</div>
          <div className="text-sm text-gray-500 mt-1">{scannedLocation.warehouse_name}</div>

          {scannedLocation.capacity_pct !== null && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    scannedLocation.capacity_pct >= 90
                      ? 'bg-red-500'
                      : scannedLocation.capacity_pct >= 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(scannedLocation.capacity_pct, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {scannedLocation.capacity_pct}%
              </span>
            </div>
          )}
        </div>

        {/* Warning if present */}
        {warning && (
          <div
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2"
            data-testid="warning-container"
          >
            <AlertTriangle
              className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5"
              data-testid="warning-icon"
            />
            <span className="text-sm text-yellow-700">{warning}</span>
          </div>
        )}

        {/* Continue button - even with warning */}
        <div className="mt-auto pt-4">
          <LargeTouchButton
            size="full"
            variant="success"
            onClick={() => {}}
            className="opacity-50 cursor-not-allowed"
            disabled
          >
            Continue to Confirm
          </LargeTouchButton>
          <p className="text-xs text-center text-gray-400 mt-2">
            Automatically proceeds to confirm step
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* LP Summary (compact) */}
        <LPSummaryCard lp={lp} compact />

        {/* Error indicator */}
        <div className="flex items-center justify-center py-4">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>

        {/* Error message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3 mt-4">
          <LargeTouchButton
            size="full"
            variant="primary"
            onClick={handleScan}
            className="min-h-[56px]"
          >
            <Scan className="h-5 w-5 mr-2" />
            Scan Different Location
          </LargeTouchButton>

          <LargeTouchButton size="full" variant="secondary" onClick={onBack}>
            Cancel Move
          </LargeTouchButton>
        </div>
      </div>
    )
  }

  // Show manual entry form
  if (isManualEntry) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* LP Summary (compact) */}
        <LPSummaryCard lp={lp} compact />

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Enter Location Code
          </h2>

          <input
            ref={inputRef}
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="A-01-R03-B05"
            className={cn(
              'w-full h-14 px-4 text-lg font-mono rounded-lg border-2 border-gray-300',
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
              'text-center uppercase'
            )}
            autoComplete="off"
            autoCapitalize="characters"
          />

          <p className="text-sm text-gray-500 text-center mt-2">
            Enter the destination location code
          </p>
        </div>

        <div className="space-y-3">
          <LargeTouchButton
            size="full"
            variant="primary"
            onClick={handleManualSubmit}
            disabled={!manualInput.trim()}
          >
            Continue
          </LargeTouchButton>

          <LargeTouchButton
            size="full"
            variant="secondary"
            onClick={() => {
              setIsManualEntry(false)
              setManualInput('')
            }}
          >
            Back to Scan Mode
          </LargeTouchButton>
        </div>
      </div>
    )
  }

  // Default scan prompt
  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      {/* LP Summary (compact) */}
      <LPSummaryCard lp={lp} compact showStatus />

      {/* Current Location */}
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <MapPin className="h-4 w-4" />
          <span>From (Current Location)</span>
        </div>
        <div className="font-medium text-gray-900">{lp.location.code}</div>
        <div className="text-sm text-gray-500">{lp.location.path}</div>
      </div>

      {/* Scan prompt */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          onClick={handleScan}
          className={cn(
            'w-16 h-16 min-h-[64px] min-w-[64px] rounded-full',
            'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
            'flex items-center justify-center',
            'shadow-lg shadow-blue-600/30',
            'transition-all duration-200 active:scale-95'
          )}
          aria-label="scan"
        >
          <Scan className="h-8 w-8 text-white" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mt-4">Scan Destination</h2>
        <p className="text-gray-500 text-center mt-2 text-sm">
          Scan the location barcode where you want to move this LP
        </p>

        <button
          onClick={() => setIsManualEntry(true)}
          className="text-blue-600 hover:text-blue-700 font-medium mt-4 min-h-[48px] px-4"
        >
          <Keyboard className="h-4 w-4 inline mr-2" />
          Select Manually
        </button>
      </div>

      {/* Warning if present (shown in all states) */}
      {warning && (
        <div
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2"
          data-testid="warning-container"
        >
          <AlertTriangle
            className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5"
            data-testid="warning-icon"
          />
          <span className="text-sm text-yellow-700">{warning}</span>
        </div>
      )}

      {/* Cancel button */}
      <div className="pt-4 border-t border-gray-200">
        <LargeTouchButton size="full" variant="secondary" onClick={onBack}>
          Cancel Move
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default Step2ScanDestination
