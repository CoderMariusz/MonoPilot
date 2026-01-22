/**
 * PackingSlipPreview Component (Story 07.13)
 * Purpose: Display Packing Slip PDF preview with actions
 *
 * Features:
 * - PDF viewer
 * - Action buttons: Print, Download, Back
 * - Metadata display: shipment number, generated_at
 *
 * AC Coverage:
 * - AC: Packing slip generation and preview
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Loader2, Printer, Download, ArrowLeft, FileText } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface PackingSlipPreviewProps {
  /** URL to the PDF file */
  pdfUrl: string
  /** Shipment number */
  shipmentNumber: string
  /** Generated timestamp (ISO string) */
  generatedAt: string
  /** File size in KB */
  fileSizeKb: number
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Print callback */
  onPrint?: () => void
  /** Download callback */
  onDownload?: () => void
  /** Back callback */
  onBack?: () => void
  /** Additional className */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function PackingSlipPreview({
  pdfUrl,
  shipmentNumber,
  generatedAt,
  fileSizeKb,
  loading = false,
  error,
  onPrint,
  onDownload,
  onBack,
  className,
}: PackingSlipPreviewProps) {
  // Format generated date
  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  // Loading state
  if (loading) {
    return (
      <div
        data-testid="pdf-viewer"
        className={cn(
          'flex items-center justify-center min-h-[600px] border rounded bg-gray-50',
          className
        )}
        role="document"
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Generating packing slip...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        data-testid="pdf-viewer"
        className={cn(
          'flex items-center justify-center min-h-[600px] border rounded bg-red-50',
          className
        )}
        role="document"
      >
        <div className="text-center text-red-600">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Failed to load packing slip</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Shipment Number and Metadata */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{shipmentNumber}</h3>
          <div className="text-sm text-muted-foreground">
            Generated: {formattedDate} | {fileSizeKb} KB
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 p-2 bg-gray-50 rounded border">
        <Button variant="outline" size="sm" onClick={onBack} aria-label="Back">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button variant="outline" size="sm" onClick={onPrint} aria-label="Print">
          <Printer className="h-4 w-4 mr-1" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={onDownload} aria-label="Download">
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </div>

      {/* PDF Viewer */}
      <div
        data-testid="pdf-viewer"
        role="document"
        className="border rounded bg-gray-100 min-h-[600px] overflow-auto"
      >
        <div className="p-4 flex justify-center">
          <iframe
            src={pdfUrl}
            className="w-full min-h-[800px] bg-white shadow-lg"
            title={`Packing Slip - ${shipmentNumber}`}
            style={{ width: '816px' }} // Letter width at 96 DPI
          />
        </div>
      </div>
    </div>
  )
}

export default PackingSlipPreview
