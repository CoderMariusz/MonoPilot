/**
 * Step 1: Select Shipment Component (Story 07.12)
 * Purpose: Display pending shipments list and allow barcode scanning
 * Features: Touch-friendly rows, allergen indicators, sort by date
 *
 * States: loading, error, empty, success
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Search, AlertTriangle, Calendar, Package, Barcode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { LargeTouchButton } from '../../shared/LargeTouchButton'
import { SuccessAnimation } from '../../shared/SuccessAnimation'
import { ErrorAnimation } from '../../shared/ErrorAnimation'
import { AudioFeedback } from '../../shared/AudioFeedback'
import { HapticFeedback } from '../../shared/HapticFeedback'
import type { PendingShipment } from '@/lib/hooks/use-scanner-pack'

interface Step1SelectShipmentProps {
  onSelect: (shipment: PendingShipment) => void
  onCancel: () => void
  className?: string
}

export function Step1SelectShipment({
  onSelect,
  onCancel,
  className,
}: Step1SelectShipmentProps) {
  const [shipments, setShipments] = useState<PendingShipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showScanInput, setShowScanInput] = useState(false)
  const [scanValue, setScanValue] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanSuccess, setScanSuccess] = useState(false)
  const scanInputRef = useRef<HTMLInputElement>(null)

  // Load pending shipments
  useEffect(() => {
    const loadShipments = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/shipping/scanner/pack/shipments')
        if (!response.ok) {
          throw new Error('Failed to load shipments')
        }
        const data = await response.json()
        setShipments(data.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shipments')
      } finally {
        setIsLoading(false)
      }
    }

    loadShipments()
  }, [])

  // Focus scan input when shown
  useEffect(() => {
    if (showScanInput && scanInputRef.current) {
      scanInputRef.current.focus()
    }
  }, [showScanInput])

  // Handle barcode scan
  const handleScan = async (barcode: string) => {
    if (!barcode.trim()) return

    setScanError(null)
    try {
      const response = await fetch(`/api/shipping/scanner/pack/lookup/${encodeURIComponent(barcode)}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Shipment not found')
        }
        const data = await response.json()
        throw new Error(data.error?.message || 'Lookup failed')
      }

      const data = await response.json()
      setScanSuccess(true)
      AudioFeedback.playSuccess()
      HapticFeedback.success()

      // Short delay to show success animation
      setTimeout(() => {
        onSelect(data.data)
      }, 500)
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Invalid barcode')
      AudioFeedback.playError()
      HapticFeedback.error()
    }
  }

  // Handle scan input submit
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleScan(scanValue)
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="shipments-skeleton" className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 border">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <ErrorAnimation show message={error} />
        <Button onClick={() => setError(null)} className="mt-4 min-h-[48px]">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Scan button / input */}
      <div className="p-4 bg-white border-b">
        {showScanInput ? (
          <form onSubmit={handleScanSubmit} className="relative">
            <Input
              ref={scanInputRef}
              data-testid="barcode-input"
              type="text"
              placeholder="Scan or enter SO/Shipment number"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              className="h-14 min-h-[56px] text-lg pr-12"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-10 w-10"
              onClick={() => {
                setShowScanInput(false)
                setScanValue('')
                setScanError(null)
              }}
            >
              &times;
            </Button>
          </form>
        ) : (
          <LargeTouchButton
            size="full"
            variant="primary"
            onClick={() => setShowScanInput(true)}
            className="gap-2"
          >
            <Barcode className="h-5 w-5" />
            Scan SO Barcode
          </LargeTouchButton>
        )}

        {scanError && (
          <div data-testid="error-message" className="mt-2 p-2 bg-red-50 text-red-600 rounded text-sm">
            {scanError}
          </div>
        )}

        {scanSuccess && (
          <div className="mt-2 flex justify-center">
            <SuccessAnimation show size={48} />
          </div>
        )}
      </div>

      {/* Empty state */}
      {shipments.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Package className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No pending shipments</p>
          <p className="text-gray-400 text-sm mt-1">All shipments have been packed</p>
        </div>
      )}

      {/* Shipments list */}
      {shipments.length > 0 && (
        <div data-testid="shipments-list" className="flex-1 overflow-y-auto p-4 space-y-2">
          {shipments.map((shipment) => (
            <button
              key={shipment.id}
              data-testid="shipment-row"
              onClick={() => onSelect(shipment)}
              className={cn(
                'w-full text-left bg-white rounded-lg p-4 border',
                'min-h-16 hover:bg-gray-50 active:bg-gray-100',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
                'flex flex-col gap-1'
              )}
            >
              {/* SO Number and Allergen */}
              <div className="flex items-center justify-between">
                <span data-testid="so-number" className="font-semibold text-gray-900">
                  {shipment.soNumber}
                </span>
                {shipment.allergenAlert && (
                  <span
                    data-testid="allergen-alert"
                    className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded text-xs font-medium"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Allergen
                  </span>
                )}
              </div>

              {/* Customer name */}
              <span data-testid="customer-name" className="text-sm text-gray-600">
                {shipment.customerName}
              </span>

              {/* Lines and Date */}
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span data-testid="lines-count">
                  {shipment.linesPacked} / {shipment.linesTotal} lines packed
                </span>
                <span data-testid="promised-date" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(shipment.promisedShipDate)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Step1SelectShipment
