/**
 * LabelActions Component (Story 07.13)
 * Purpose: Action buttons for label and document generation
 *
 * Features:
 * - Generate SSCC button
 * - Print Labels button
 * - Generate BOL button
 * - Packing Slip button
 * - State management based on SSCC/carrier availability
 * - Loading states with spinners
 *
 * AC Coverage:
 * - AC: LabelActions provides 4 buttons (Generate SSCC, Print Labels, BOL, Packing Slip)
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Loader2, Barcode, Printer, FileText, Package, Check } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export type ShipmentStatus = 'draft' | 'packed' | 'shipped' | 'delivered'

export interface LabelActionsProps {
  /** Shipment ID */
  shipmentId: string
  /** Whether SSCC has been generated */
  hasSSCC: boolean
  /** Whether carrier is assigned */
  hasCarrier: boolean
  /** Current shipment status */
  shipmentStatus: ShipmentStatus
  /** Whether SSCC is being generated */
  generatingSSCC?: boolean
  /** Whether labels are being printed */
  printingLabels?: boolean
  /** Whether BOL is being generated */
  generatingBOL?: boolean
  /** Whether packing slip is being generated */
  generatingPackingSlip?: boolean
  /** Generate SSCC callback */
  onGenerateSSCC?: () => void
  /** Print labels callback */
  onPrintLabels?: () => void
  /** Generate BOL callback */
  onGenerateBOL?: () => void
  /** Packing slip callback */
  onPackingSlip?: () => void
  /** Additional className */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function LabelActions({
  shipmentId,
  hasSSCC,
  hasCarrier,
  shipmentStatus,
  generatingSSCC = false,
  printingLabels = false,
  generatingBOL = false,
  generatingPackingSlip = false,
  onGenerateSSCC,
  onPrintLabels,
  onGenerateBOL,
  onPackingSlip,
  className,
}: LabelActionsProps) {
  // Determine if any operation is in progress
  const isAnyLoading = generatingSSCC || printingLabels || generatingBOL || generatingPackingSlip

  // Button states
  const canGenerateSSCC = !isAnyLoading
  const canPrintLabels = hasSSCC && !isAnyLoading
  const canGenerateBOL = hasSSCC && hasCarrier && !isAnyLoading
  const canGeneratePackingSlip = hasSSCC && !isAnyLoading

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {/* Generate SSCC Button */}
      <Button
        variant={hasSSCC ? 'secondary' : 'default'}
        onClick={onGenerateSSCC}
        disabled={!canGenerateSSCC || isAnyLoading}
        aria-label={hasSSCC ? 'Regenerate SSCC' : 'Generate SSCC'}
      >
        {generatingSSCC ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin spinner" />
        ) : hasSSCC ? (
          <Check className="h-4 w-4 mr-2" />
        ) : (
          <Barcode className="h-4 w-4 mr-2" />
        )}
        {hasSSCC ? 'Regenerate SSCC' : 'Generate SSCC'}
      </Button>

      {/* Print Labels Button */}
      <Button
        variant="outline"
        onClick={onPrintLabels}
        disabled={!canPrintLabels}
        aria-label="Print Labels"
        title={!hasSSCC ? 'Generate SSCC first to print labels' : undefined}
      >
        {printingLabels ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin spinner" />
        ) : (
          <Printer className="h-4 w-4 mr-2" />
        )}
        Print Labels
      </Button>

      {/* Generate BOL Button */}
      <Button
        variant="outline"
        onClick={onGenerateBOL}
        disabled={!canGenerateBOL}
        aria-label="Generate BOL"
        title={
          !hasSSCC
            ? 'Generate SSCC first to create BOL'
            : !hasCarrier
              ? 'Assign carrier to generate BOL'
              : undefined
        }
      >
        {generatingBOL ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin spinner" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        Generate BOL
      </Button>

      {/* Packing Slip Button */}
      <Button
        variant="outline"
        onClick={onPackingSlip}
        disabled={!canGeneratePackingSlip}
        aria-label="Packing Slip"
        title={!hasSSCC ? 'Generate SSCC first to create packing slip' : undefined}
      >
        {generatingPackingSlip ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin spinner" />
        ) : (
          <Package className="h-4 w-4 mr-2" />
        )}
        Packing Slip
      </Button>
    </div>
  )
}

export default LabelActions
