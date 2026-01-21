/**
 * Step 3: Scan Location (Story 05.21)
 * Purpose: Scan location barcode to confirm putaway destination
 * Handles match vs mismatch with override option (AC-3, AC-4)
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScanBarcode, Keyboard, CheckCircle } from 'lucide-react'
import { LocationOverrideWarning } from './LocationOverrideWarning'
import { AudioFeedback } from '../shared/AudioFeedback'
import { HapticFeedback } from '../shared/HapticFeedback'
import type { SuggestedLocation, ScannedLocation } from './ScannerPutawayWizard'

interface Step3ScanLocationProps {
  suggestedLocation: SuggestedLocation | null
  scannedLocation?: ScannedLocation | null
  onLocationScanned: (location: ScannedLocation) => void
  onOverride: () => void
  error?: string | null
}

export function Step3ScanLocation({
  suggestedLocation,
  scannedLocation,
  onLocationScanned,
  onOverride,
  error,
}: Step3ScanLocationProps) {
  const [barcode, setBarcode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    const trimmed = barcode.trim()
    if (!trimmed || isScanning) return

    setIsScanning(true)

    try {
      // Validate location
      const response = await fetch(`/api/warehouse/scanner/lookup/location/${encodeURIComponent(trimmed)}`)
      const data = await response.json()

      if (!response.ok || !data.data) {
        AudioFeedback.playError()
        HapticFeedback.error()
        throw new Error(data.error || 'Location not found')
      }

      const matches = suggestedLocation
        ? data.data.location_code === suggestedLocation.location_code
        : false

      const scanned: ScannedLocation = {
        location_code: data.data.location_code,
        matches,
        id: data.data.id,
        full_path: data.data.full_path,
        zone_name: data.data.zone_name,
      }

      if (matches) {
        AudioFeedback.playSuccess()
        HapticFeedback.success()
      } else {
        AudioFeedback.playAlert()
        HapticFeedback.warning()
      }

      onLocationScanned(scanned)
    } catch (err) {
      console.error('Location scan error:', err)
    } finally {
      setIsScanning(false)
    }
  }, [barcode, isScanning, suggestedLocation, onLocationScanned])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleUseSuggested = useCallback(() => {
    setBarcode('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Show match indicator
  if (scannedLocation?.matches) {
    return (
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div data-testid="match-indicator" className="text-center">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Location matches!</h2>
            <p className="text-gray-600">
              Scanned: <span className="font-mono font-medium">{scannedLocation.location_code}</span>
            </p>
            <p className="text-gray-600">
              Suggested: <span className="font-mono font-medium">{suggestedLocation?.location_code}</span>
              <CheckCircle className="w-4 h-4 text-green-500 inline ml-1" />
            </p>
          </div>
        </div>
        <div className="pb-safe">
          <p className="text-center text-gray-500">Auto-confirming in 2s...</p>
        </div>
      </div>
    )
  }

  // Show override warning if mismatch
  if (scannedLocation && !scannedLocation.matches) {
    return (
      <div className="flex-1 flex flex-col p-4">
        <div data-testid="override-warning">
          <LocationOverrideWarning
            suggestedLocation={suggestedLocation?.location_code || ''}
            selectedLocation={scannedLocation.location_code}
            reason={suggestedLocation ? 'FIFO zone' : ''}
            onUseSuggested={handleUseSuggested}
            onOverride={onOverride}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Location Barcode</h2>
        {suggestedLocation && (
          <div className="text-gray-500">
            Suggested: <span className="font-mono font-medium text-cyan-600">{suggestedLocation.location_code}</span>
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
              FIFO zone
            </span>
          </div>
        )}
      </div>

      {/* Scan icon */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-[68px] h-[68px] flex items-center justify-center bg-slate-100 rounded-lg">
          <ScanBarcode className="w-12 h-12 text-slate-600" />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
          {error}
        </div>
      )}

      {/* Barcode input */}
      <div className="mb-4">
        <Input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Location barcode"
          className={cn(
            'h-12 min-h-[48px] text-xl font-mono text-center',
            'border-2 focus:border-cyan-500'
          )}
          autoComplete="off"
          autoFocus
          disabled={isScanning}
          aria-label="Location barcode"
        />
        <button
          type="button"
          className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
        >
          <Keyboard className="h-4 w-4" />
          Tap to type manually
        </button>
      </div>

      {/* Quick actions */}
      {suggestedLocation && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Quick Actions:</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-12 min-h-[48px]"
              onClick={() => {
                setBarcode(suggestedLocation.location_code)
              }}
            >
              Suggested Location
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 min-h-[48px]"
              onClick={handleSubmit}
              disabled={!barcode.trim()}
            >
              Scan
            </Button>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action bar */}
      <div className="pb-safe">
        <Button
          onClick={handleSubmit}
          disabled={!barcode.trim() || isScanning}
          className={cn(
            'w-full h-12 min-h-[48px] text-lg font-semibold',
            'bg-cyan-600 hover:bg-cyan-700 text-white'
          )}
        >
          {isScanning ? 'Validating...' : 'Scan'}
        </Button>
        <p className="text-center text-sm text-gray-400 mt-2">or press Enter</p>
      </div>
    </div>
  )
}

export default Step3ScanLocation
