/**
 * Step 1: Scan LP Component (Story 05.20)
 * Purpose: Scan or enter LP barcode for movement
 * Features: Barcode scan, manual entry, recent moves list
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Scan, Keyboard, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { Badge } from '@/components/ui/badge'
import type { LPLookupResult, RecentMoveResult } from '@/lib/validation/scanner-move'

interface Step1ScanLPProps {
  onLPScanned: (barcode: string) => void
  onError: (message: string) => void
  scannedLP?: LPLookupResult
  error?: string
  recentMoves?: RecentMoveResult[]
}

export function Step1ScanLP({
  onLPScanned,
  onError,
  scannedLP,
  error,
  recentMoves = [],
}: Step1ScanLPProps) {
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
      // Check for obviously invalid barcodes
      if (!barcode.match(/^LP\d+$/)) {
        onError(`LP not found: ${barcode}`)
        return
      }
      onLPScanned(barcode)
    } else {
      onError('Please enter a barcode')
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

  const handleRecentMoveClick = (lpNumber: string) => {
    onLPScanned(lpNumber)
  }

  // Show LP details after successful scan
  if (scannedLP) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* Success indicator */}
        <div className="flex items-center justify-center py-4">
          <CheckCircle2
            className="h-16 w-16 text-green-500"
            data-testid="success-icon"
          />
        </div>

        {/* LP Details Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">{scannedLP.lp_number}</span>
            <Badge variant="default" className="bg-green-600">
              Available
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Product:</span>
              <span className="font-medium text-gray-900">{scannedLP.product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">SKU:</span>
              <span className="font-medium text-gray-900">{scannedLP.product.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Quantity:</span>
              <span className="font-medium text-gray-900">
                {scannedLP.quantity} {scannedLP.uom}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location:</span>
              <span className="font-medium text-gray-900">{scannedLP.location.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Path:</span>
              <span className="font-medium text-gray-900 text-right max-w-[200px]">
                {scannedLP.location.path}
              </span>
            </div>
            {scannedLP.batch_number && (
              <div className="flex justify-between">
                <span className="text-gray-500">Batch:</span>
                <span className="font-medium text-gray-900">{scannedLP.batch_number}</span>
              </div>
            )}
            {scannedLP.expiry_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">Expiry:</span>
                <span className="font-medium text-gray-900">{scannedLP.expiry_date}</span>
              </div>
            )}
            {scannedLP.qa_status && (
              <div className="flex justify-between">
                <span className="text-gray-500">QA Status:</span>
                <Badge
                  variant={scannedLP.qa_status === 'passed' ? 'default' : 'secondary'}
                  className={cn(
                    scannedLP.qa_status === 'passed' && 'bg-green-600',
                    scannedLP.qa_status === 'failed' && 'bg-red-600',
                    scannedLP.qa_status === 'pending' && 'bg-yellow-600'
                  )}
                >
                  {scannedLP.qa_status}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* Error indicator */}
        <div className="flex items-center justify-center py-4">
          <XCircle className="h-16 w-16 text-red-500" data-testid="error-icon" />
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
            className="min-h-[80px]"
          >
            <Scan className="h-6 w-6 mr-2" />
            Scan Again
          </LargeTouchButton>

          <LargeTouchButton
            size="full"
            variant="secondary"
            onClick={() => setIsManualEntry(true)}
          >
            <Keyboard className="h-5 w-5 mr-2" />
            Manual Entry
          </LargeTouchButton>
        </div>
      </div>
    )
  }

  // Show manual entry form
  if (isManualEntry) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Enter LP Number
          </h2>

          <input
            ref={inputRef}
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="LP00000001"
            className={cn(
              'w-full h-14 px-4 text-lg font-mono rounded-lg border-2 border-gray-300',
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
              'text-center uppercase'
            )}
            autoComplete="off"
            autoCapitalize="characters"
          />

          <p className="text-sm text-gray-500 text-center mt-2">
            Enter the LP number and press Enter
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
      {/* Scan prompt */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          onClick={handleScan}
          className={cn(
            'w-20 h-20 rounded-full',
            'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
            'flex items-center justify-center',
            'shadow-lg shadow-blue-600/30',
            'transition-all duration-200 active:scale-95'
          )}
          style={{ minHeight: 80, minWidth: 80 }}
          aria-label="scan"
        >
          <Scan className="h-10 w-10 text-white" />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 mt-6">Scan LP Barcode</h2>
        <p className="text-gray-500 text-center mt-2">
          Point camera at LP barcode or use external scanner
        </p>

        <button
          onClick={() => setIsManualEntry(true)}
          className="text-blue-600 hover:text-blue-700 font-medium mt-4 min-h-[48px] px-4"
        >
          <Keyboard className="h-4 w-4 inline mr-2" />
          Enter Manually
        </button>
      </div>

      {/* Recent Moves */}
      {recentMoves.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            <Clock className="h-4 w-4 inline mr-1" />
            Recent Moves
          </h3>
          <div className="space-y-2">
            {recentMoves.slice(0, 5).map((move) => (
              <button
                key={move.id}
                onClick={() => handleRecentMoveClick(move.lp_number)}
                className={cn(
                  'w-full p-3 rounded-lg border border-gray-200 bg-gray-50',
                  'hover:bg-gray-100 active:bg-gray-200',
                  'text-left min-h-[56px]',
                  'transition-colors'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium text-gray-900">{move.lp_number}</span>
                  <span className="text-xs text-gray-500">{move.relative_time}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span>{move.from_location_code}</span>
                  <ArrowRight className="h-3 w-3 mx-1" />
                  <span>{move.to_location_code}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {recentMoves.length === 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="text-center py-4">
            <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No recent moves</p>
            <p className="text-xs text-gray-400 mt-1">
              Your recent move history will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Step1ScanLP
