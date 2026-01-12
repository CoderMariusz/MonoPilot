/**
 * Bulk Print Modal Component (Story 05.14)
 * Purpose: Modal for printing labels for multiple LPs
 *
 * AC Coverage:
 * - AC-6: Bulk print from LP list
 */

'use client'

import { useState } from 'react'
import { Download, Loader2, AlertCircle, Package } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { CopiesInput } from './CopiesInput'

interface SelectedLP {
  id: string
  lp_number: string
  product_id?: string
  product?: { name: string; code: string }
  quantity: number
  uom: string
  batch_number?: string | null
  expiry_date?: string | null
  status: string
}

interface BulkPrintModalProps {
  selectedLPs: SelectedLP[]
  isOpen: boolean
  onClose: () => void
  onPrintComplete?: () => void
}

const MAX_BULK_LPS = 100

export function BulkPrintModal({
  selectedLPs,
  isOpen,
  onClose,
  onPrintComplete,
}: BulkPrintModalProps) {
  const [copies, setCopies] = useState(1)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalLabels = selectedLPs.length * copies
  const exceedsLimit = selectedLPs.length > MAX_BULK_LPS
  const isEmpty = selectedLPs.length === 0

  const handleDownloadAll = async () => {
    if (exceedsLimit || isEmpty) return

    setDownloading(true)
    setError(null)

    try {
      const response = await fetch('/api/warehouse/license-plates/print-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_ids: selectedLPs.map((lp) => lp.id),
          copies,
          format: 'zip',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Bulk print failed')
      }

      // Download as blob
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lp-labels-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      onPrintComplete?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk print failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Print Labels for {selectedLPs.length} LPs</DialogTitle>
          <DialogDescription>
            Download ZPL labels for all selected License Plates
          </DialogDescription>
        </DialogHeader>

        {isEmpty ? (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>No LPs selected. Select LPs from the list first.</AlertDescription>
          </Alert>
        ) : exceedsLimit ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Maximum 100 LPs per bulk request. You selected {selectedLPs.length}.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 py-4">
            {/* Selected LPs List */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Selected License Plates</h3>
              <ScrollArea className="h-48 border rounded-md">
                <div className="p-2 space-y-1">
                  {selectedLPs.map((lp) => (
                    <div
                      key={lp.id}
                      className="flex items-center justify-between py-1 px-2 text-sm hover:bg-muted rounded"
                    >
                      <span className="font-mono">{lp.lp_number}</span>
                      <span className="text-muted-foreground text-xs">
                        {lp.product?.name || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Copies Input */}
            <div className="pt-2 border-t">
              <CopiesInput
                value={copies}
                onChange={setCopies}
                label="Copies per LP"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {totalLabels} total labels ({selectedLPs.length} LPs x {copies} copies)
              </p>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDownloadAll}
            disabled={downloading || exceedsLimit || isEmpty}
          >
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download All ZPL
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
