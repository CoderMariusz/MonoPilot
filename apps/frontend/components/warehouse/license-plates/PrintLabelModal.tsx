/**
 * Print Label Modal Component (Story 05.14)
 * Purpose: Modal for printing single LP label with preview
 *
 * AC Coverage:
 * - AC-5: Print button on LP detail page
 * - AC-7: Label preview modal
 * - AC-11: Copies validation
 */

'use client'

import { useState, useEffect } from 'react'
import { Download, Printer, Loader2, AlertCircle, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { LabelPreview } from './LabelPreview'
import { CopiesInput } from './CopiesInput'

interface LPData {
  id: string
  lp_number: string
  product_id: string
  product?: { name: string; code: string }
  quantity: number
  uom: string
  batch_number?: string | null
  expiry_date?: string | null
  manufacture_date?: string | null
  location_id?: string | null
  location?: { id: string; full_path: string }
  warehouse_id?: string | null
  warehouse?: { id: string; name: string; code: string }
  status: string
  qa_status?: string
}

interface PrintLabelModalProps {
  lpId: string
  lpNumber: string
  isOpen: boolean
  onClose: () => void
  onPrintComplete?: () => void
  defaultCopies?: number
  printerConfigured?: boolean
}

export function PrintLabelModal({
  lpId,
  lpNumber,
  isOpen,
  onClose,
  onPrintComplete,
  defaultCopies = 1,
  printerConfigured = false,
}: PrintLabelModalProps) {
  const [lpData, setLpData] = useState<LPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copies, setCopies] = useState(defaultCopies)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  // Fetch LP data when modal opens
  useEffect(() => {
    if (isOpen && lpId) {
      fetchLPData()
    }
  }, [isOpen, lpId])

  const fetchLPData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}`)
      if (!response.ok) {
        throw new Error('Failed to load LP data')
      }
      const result = await response.json()
      setLpData(result.data || result.license_plate || result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load LP data')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadZPL = async () => {
    setDownloading(true)
    setDownloadError(null)

    try {
      const response = await fetch(
        `/api/warehouse/license-plates/${lpId}/print-label?copies=${copies}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate label')
      }

      const data = await response.json()

      // Create blob and download
      const blob = new Blob([data.zpl], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.download_filename || `${lpNumber}.zpl`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      onPrintComplete?.()
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Failed to generate label')
    } finally {
      setDownloading(false)
    }
  }

  const labelPreviewData = lpData
    ? {
        lp_number: lpData.lp_number,
        product_name: lpData.product?.name || 'Unknown Product',
        quantity: lpData.quantity,
        uom: lpData.uom,
        batch_number: lpData.batch_number,
        expiry_date: lpData.expiry_date,
        manufacture_date: lpData.manufacture_date,
        location_path: lpData.location?.full_path,
      }
    : null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Print Label for {lpNumber}</DialogTitle>
          <DialogDescription>
            Configure and preview the label before downloading
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load LP data: {error}</AlertDescription>
          </Alert>
        ) : lpData && labelPreviewData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* LP Info Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Label Information</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{lpData.product?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">
                    {lpData.quantity} {lpData.uom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch:</span>
                  <span className="font-medium">{lpData.batch_number || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expiry:</span>
                  <span className="font-medium">{lpData.expiry_date || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium text-xs">
                    {lpData.location?.full_path || '--'}
                  </span>
                </div>
              </div>

              {/* Copies Input */}
              <div className="pt-4 border-t">
                <CopiesInput
                  value={copies}
                  onChange={setCopies}
                  label="Number of Copies"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {copies} {copies === 1 ? 'copy' : 'copies'} will be printed
                </p>
              </div>

              {/* No Printer Warning */}
              {!printerConfigured && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No printer configured. Download ZPL and send to printer manually.
                  </AlertDescription>
                </Alert>
              )}

              {/* Download Error */}
              {downloadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{downloadError}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Label Preview */}
            <div className="flex flex-col items-center">
              <h3 className="font-semibold text-sm mb-4 self-start">Preview</h3>
              <LabelPreview data={labelPreviewData} />
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDownloadZPL} disabled={loading || downloading || !!error}>
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download ZPL
              </>
            )}
          </Button>
          {printerConfigured && (
            <Button variant="default" disabled={loading || downloading || !!error}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
