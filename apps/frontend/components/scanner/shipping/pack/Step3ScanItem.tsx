/**
 * Step 3: Scan Item Component (Story 07.12)
 * Purpose: Scan LP barcode to add item to box
 * Features: Auto-focus input, success/error animations, LP lookup
 *
 * States: loading, error, empty, success
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Package, Barcode } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SuccessAnimation } from '../../shared/SuccessAnimation'
import { ErrorAnimation } from '../../shared/ErrorAnimation'
import { LoadingOverlay } from '../../shared/LoadingOverlay'
import { AudioFeedback } from '../../shared/AudioFeedback'
import { HapticFeedback } from '../../shared/HapticFeedback'
import type { PendingShipment, ShipmentBox, LPLookupResult } from '@/lib/hooks/use-scanner-pack'

interface Step3ScanItemProps {
  box: ShipmentBox
  shipment: PendingShipment
  onItemScanned: (lpData: LPLookupResult) => void
  onCancel: () => void
  className?: string
}

export function Step3ScanItem({
  box,
  shipment,
  onItemScanned,
  onCancel,
  className,
}: Step3ScanItemProps) {
  const [scanValue, setScanValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [lpDetails, setLpDetails] = useState<LPLookupResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Handle barcode scan
  const handleScan = async (barcode: string) => {
    if (!barcode.trim()) return

    setIsLoading(true)
    setError(null)
    setShowError(false)
    setShowSuccess(false)

    try {
      const response = await fetch(
        `/api/shipping/scanner/pack/lookup/${encodeURIComponent(barcode)}?shipment_id=${shipment.id}`
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('LP not found')
        }
        const data = await response.json()
        throw new Error(data.error?.message || 'Lookup failed')
      }

      const data = await response.json()
      const lpData = data.data as LPLookupResult

      // Check if LP is allocated to this shipment
      if (!lpData.allocated) {
        throw new Error('LP not allocated to this shipment')
      }

      setLpDetails(lpData)
      setShowSuccess(true)
      AudioFeedback.playSuccess()
      HapticFeedback.success()

      // Brief delay to show success, then proceed
      setTimeout(() => {
        onItemScanned(lpData)
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid barcode'
      setError(errorMessage)
      setShowError(true)
      AudioFeedback.playError()
      HapticFeedback.error()

      // Clear error state after animation
      setTimeout(() => {
        setShowError(false)
        setScanValue('')
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 2000)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleScan(scanValue)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Loading overlay */}
      {isLoading && <LoadingOverlay show message="Looking up LP..." />}

      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-gray-900">Box {box.boxNumber}</span>
        </div>
        <p className="text-sm text-gray-500">{shipment.soNumber}</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Success animation */}
        {showSuccess && (
          <SuccessAnimation show size={80} />
        )}

        {/* Error animation */}
        {showError && (
          <ErrorAnimation show size={80} message={error || undefined} />
        )}

        {/* LP Details card (shown after successful scan) */}
        {lpDetails && !showError && (
          <div data-testid="lp-details-card" className="w-full bg-white rounded-lg border p-4 mb-4">
            <h3 data-testid="product-name" className="font-semibold text-lg text-gray-900">
              {lpDetails.productName}
            </h3>
            <p data-testid="lot-number" className="text-sm text-gray-500 mt-1">
              Lot: {lpDetails.lotNumber}
            </p>
            <p className="text-sm text-gray-500">LP: {lpDetails.lpNumber}</p>
            <p data-testid="available-qty" className="text-sm font-medium text-green-600 mt-2">
              Available: {lpDetails.availableQty} {lpDetails.uom}
            </p>
          </div>
        )}

        {/* Scan instruction (shown when no success/error) */}
        {!showSuccess && !showError && !lpDetails && (
          <>
            <Barcode className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Scan License Plate
            </h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              Scan the LP barcode to add item to box
            </p>
          </>
        )}

        {/* Scan input */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <Input
            ref={inputRef}
            data-testid="barcode-input"
            type="text"
            placeholder="Enter LP barcode"
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            className="h-14 min-h-[56px] text-lg text-center"
            autoComplete="off"
            disabled={isLoading}
          />
        </form>

        {/* Error message */}
        {error && !showError && (
          <div data-testid="error-message" className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Cancel button */}
      <div className="p-4 bg-white border-t safe-area-bottom">
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full h-12 min-h-[48px]"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default Step3ScanItem
