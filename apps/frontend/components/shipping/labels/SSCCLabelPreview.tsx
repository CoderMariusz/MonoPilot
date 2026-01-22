/**
 * SSCCLabelPreview Component (Story 07.13)
 * Purpose: Display SSCC shipping label preview with barcode
 *
 * Features:
 * - GS1-128 barcode image display
 * - Human-readable formatted SSCC
 * - Ship-to address section
 * - Format selector (4x6 / 4x8)
 * - Scale controls
 *
 * AC Coverage:
 * - AC: SSCCLabelPreview displays barcode image, formatted SSCC, metadata
 * - AC: Label format selector: [4x6"] [4x8"]
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Loader2 } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface ShipToInfo {
  customerName: string
  addressLine1: string
  cityStateZip: string
}

export interface SSCCLabelPreviewProps {
  /** 18-digit SSCC */
  sscc: string
  /** Formatted SSCC with spaces */
  ssccFormatted: string
  /** Base64 barcode image */
  barcodeImage?: string
  /** Ship-to address */
  shipTo: ShipToInfo
  /** Order number */
  orderNumber: string
  /** Box number in "X of Y" format */
  boxNumber: string
  /** Weight with unit */
  weight: string
  /** Label format */
  format: '4x6' | '4x8'
  /** Handling instructions (optional) */
  handlingInstructions?: string
  /** Show format selector */
  showFormatSelector?: boolean
  /** Show scale controls */
  showScaleControls?: boolean
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Format change callback */
  onFormatChange?: (format: '4x6' | '4x8') => void
  /** Additional className */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function SSCCLabelPreview({
  sscc,
  ssccFormatted,
  barcodeImage,
  shipTo,
  orderNumber,
  boxNumber,
  weight,
  format,
  handlingInstructions,
  showFormatSelector = false,
  showScaleControls = false,
  loading = false,
  error,
  onFormatChange,
  className,
}: SSCCLabelPreviewProps) {
  const [scale, setScale] = useState(100)

  // Handle scale changes
  const handleScaleUp = () => {
    setScale((prev) => Math.min(prev + 10, 150))
  }

  const handleScaleDown = () => {
    setScale((prev) => Math.max(prev - 10, 50))
  }

  // Loading state
  if (loading) {
    return (
      <div
        data-testid="sscc-label-preview"
        className={cn(
          'flex items-center justify-center min-h-[400px] border rounded bg-gray-50',
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Generating label...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        data-testid="sscc-label-preview"
        className={cn(
          'flex items-center justify-center min-h-[400px] border rounded bg-red-50',
          className
        )}
      >
        <div className="text-center text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // Label dimensions based on format (4x6 or 4x8)
  const labelHeight = format === '4x6' ? 'aspect-[4/6]' : 'aspect-[4/8]'

  return (
    <div data-testid="sscc-label-preview" className={cn('space-y-4', className)}>
      {/* Controls Row */}
      <div className="flex items-center justify-between">
        {/* Format Selector */}
        {showFormatSelector && (
          <select
            data-testid="format-selector"
            className="w-32 h-10 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Label format"
            value={format}
            onChange={(e) => onFormatChange?.(e.target.value as '4x6' | '4x8')}
          >
            <option value="4x6">4x6"</option>
            <option value="4x8">4x8"</option>
          </select>
        )}

        {/* Scale Controls */}
        {showScaleControls && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleScaleDown}
              aria-label="Zoom out"
              disabled={scale <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[50px] text-center">{scale}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScaleUp}
              aria-label="Zoom in"
              disabled={scale >= 150}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Label Preview */}
      <div
        className="flex justify-center overflow-auto"
        style={{ transform: `scale(${scale / 100})`, transformOrigin: 'top center' }}
      >
        <div
          className={cn(
            'w-full max-w-[400px] border-2 border-gray-800 rounded bg-white p-6 font-mono text-sm',
            labelHeight
          )}
        >
          {/* Ship To Section */}
          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-2">
              SHIP TO
            </div>
            <div className="space-y-1">
              <div className="font-bold text-base">{shipTo.customerName}</div>
              <div className="text-sm">{shipTo.addressLine1}</div>
              <div className="text-sm">{shipTo.cityStateZip}</div>
            </div>
          </div>

          {/* Order Info */}
          <div className="flex justify-between mb-4 text-xs">
            <span>{orderNumber}</span>
            <span>{boxNumber}</span>
            <span>{weight}</span>
          </div>

          {/* Handling Instructions */}
          {handlingInstructions && (
            <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              {handlingInstructions}
            </div>
          )}

          {/* Barcode Section */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            {/* Barcode Image */}
            {barcodeImage ? (
              <div className="flex flex-col items-center">
                <img
                  src={barcodeImage.startsWith('data:') ? barcodeImage : `data:image/png;base64,${barcodeImage}`}
                  alt={`SSCC barcode for ${sscc}`}
                  className="max-h-24 w-auto"
                  role="img"
                />
              </div>
            ) : (
              <div className="h-20 bg-gradient-to-b from-black to-black flex items-center justify-center"
                   style={{ background: 'repeating-linear-gradient(90deg, black 0px, black 2px, white 2px, white 4px)' }}
              />
            )}

            {/* Human-readable SSCC */}
            <div className="text-center mt-2">
              <span className="text-xs text-muted-foreground">(00) AI</span>
              <div className="font-bold text-sm tracking-wide">{ssccFormatted}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SSCCLabelPreview
