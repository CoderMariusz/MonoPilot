/**
 * Step 1: Scan LP Barcode (Story 05.21)
 * Purpose: Scan or enter license plate barcode to begin putaway
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScanBarcode, Keyboard, CheckCircle } from 'lucide-react'
import { AudioFeedback } from '../shared/AudioFeedback'
import { HapticFeedback } from '../shared/HapticFeedback'
import type { LPDetails, LocationSuggestionData } from './ScannerPutawayWizard'

interface Step1ScanLPProps {
  onLPScanned: (lp: LPDetails, suggestion: LocationSuggestionData) => void | Promise<void>
  lpDetails?: LPDetails | null
  error?: string | null
  isLoading?: boolean
  /** Optional callback to handle barcode scan - if not provided, will make fetch calls */
  onBarcodeScan?: (barcode: string) => Promise<{ lp: LPDetails; suggestion: LocationSuggestionData }>
}

export function Step1ScanLP({ onLPScanned, lpDetails, error, isLoading = false, onBarcodeScan }: Step1ScanLPProps) {
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
    if (!trimmed || isLoading || isScanning) return

    setIsScanning(true)

    try {
      // Use custom scan callback if provided (for testing), otherwise use fetch
      if (onBarcodeScan) {
        const { lp, suggestion } = await onBarcodeScan(trimmed)
        AudioFeedback.playSuccess()
        HapticFeedback.success()
        onLPScanned(lp, suggestion)
      } else {
        // Lookup LP and get suggestion
        const lpResponse = await fetch(`/api/warehouse/scanner/lookup/lp/${encodeURIComponent(trimmed)}`)
        const lpData = await lpResponse.json()

        if (!lpResponse.ok || !lpData.data) {
          AudioFeedback.playError()
          HapticFeedback.error()
          throw new Error(lpData.error || 'LP not found')
        }

        // Get putaway suggestion
        const suggestResponse = await fetch(`/api/warehouse/scanner/putaway/suggest/${lpData.data.id}`)
        const suggestData = await suggestResponse.json()

        if (!suggestResponse.ok) {
          AudioFeedback.playError()
          HapticFeedback.error()
          throw new Error(suggestData.error || 'Failed to get putaway suggestion')
        }

        AudioFeedback.playSuccess()
        HapticFeedback.success()

        // Transform LP data
        const lp: LPDetails = {
          id: lpData.data.id,
          lp_number: lpData.data.lp_number,
          product_name: lpData.data.product?.name || lpData.data.product_name,
          product_code: lpData.data.product?.code || lpData.data.product_code,
          quantity: lpData.data.quantity || lpData.data.current_qty,
          uom: lpData.data.uom,
          batch_number: lpData.data.batch_number,
          expiry_date: lpData.data.expiry_date,
          current_location: lpData.data.location?.full_path || lpData.data.current_location,
          status: lpData.data.status,
        }

        // Transform suggestion data
        const suggestion: LocationSuggestionData = {
          suggestedLocation: suggestData.suggested_location,
          reason: suggestData.reason,
          reasonCode: suggestData.reason_code,
          alternatives: suggestData.alternatives || [],
          strategyUsed: suggestData.strategy_used || 'fifo',
        }

        onLPScanned(lp, suggestion)
      }
    } catch (err) {
      // Error will be displayed via error prop from parent
      console.error('LP scan error:', err)
    } finally {
      setIsScanning(false)
    }
  }, [barcode, isLoading, isScanning, onLPScanned, onBarcodeScan])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  // Show LP details if already scanned
  if (lpDetails) {
    return (
      <div className="flex-1 flex flex-col p-4">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-xl font-mono font-bold">{lpDetails.lp_number}</span>
          </div>
        </div>

        <div className="bg-green-900 text-green-300 rounded-lg p-4 mb-4">
          <div className="space-y-2 text-lg">
            <div className="flex justify-between">
              <span>LP Number:</span>
              <span className="font-mono">{lpDetails.lp_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Product:</span>
              <span>{lpDetails.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>{lpDetails.quantity} {lpDetails.uom}</span>
            </div>
            {lpDetails.batch_number && (
              <div className="flex justify-between">
                <span>Batch:</span>
                <span>{lpDetails.batch_number}</span>
              </div>
            )}
            {lpDetails.expiry_date && (
              <div className="flex justify-between">
                <span>Expiry:</span>
                <span>{lpDetails.expiry_date}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Current Location:</span>
              <span>{lpDetails.current_location}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span>{lpDetails.status}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan LP Barcode</h2>
        <p className="text-gray-500">Scan the License Plate barcode to start putaway</p>
      </div>

      {/* Scan icon */}
      <div className="flex items-center justify-center mb-8">
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

      {/* Loading state */}
      {(isLoading || isScanning) && (
        <div className="mb-4 text-center text-gray-500">
          <span className="animate-pulse">Scanning {barcode}...</span>
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
          placeholder="LP00000001"
          className={cn(
            'h-12 min-h-[48px] text-xl font-mono text-center',
            'border-2 focus:border-cyan-500'
          )}
          autoComplete="off"
          autoFocus
          disabled={isLoading || isScanning}
          aria-label="LP barcode"
        />
        <button
          type="button"
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
          disabled={!barcode.trim() || isLoading || isScanning}
          className={cn(
            'w-full h-12 min-h-[48px] text-lg font-semibold',
            'bg-cyan-600 hover:bg-cyan-700 text-white'
          )}
          aria-label="scan lp barcode"
        >
          {isLoading || isScanning ? 'Scanning...' : 'Scan LP Barcode'}
        </Button>
        <p className="text-center text-sm text-gray-400 mt-2">or press Enter</p>
      </div>
    </div>
  )
}

export default Step1ScanLP
