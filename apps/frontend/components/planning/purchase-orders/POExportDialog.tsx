/**
 * PO Export Dialog
 * Story: 03.6 - PO Bulk Operations
 * Export configuration dialog for bulk PO export per PLAN-004
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { FileSpreadsheet, Download, Loader2, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  useExportPOs,
  downloadFile,
  generateExportFilename,
} from '@/lib/hooks/use-bulk-po-operations'
import { EXPORT_MAX_POS } from '@/lib/types/po-bulk'
import type { POExportRequest } from '@/lib/types/po-bulk'

interface POExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPoIds: string[]
  totalPoCount: number
  filters?: POExportRequest['filters']
}

type ExportStatus = 'idle' | 'preparing' | 'generating' | 'complete' | 'error'

export function POExportDialog({
  open,
  onOpenChange,
  selectedPoIds,
  totalPoCount,
  filters,
}: POExportDialogProps) {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const exportPOs = useExportPOs()

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStatus('idle')
      setProgress(0)
      setError(null)
    }
  }, [open])

  const exportCount = selectedPoIds.length > 0 ? selectedPoIds.length : totalPoCount
  const isUsingSelection = selectedPoIds.length > 0
  const exceedsLimit = exportCount > EXPORT_MAX_POS

  const handleExport = useCallback(async () => {
    if (exceedsLimit) {
      setError(`Export limit is ${EXPORT_MAX_POS} POs. Please reduce your selection.`)
      return
    }

    setStatus('preparing')
    setProgress(10)
    setError(null)

    try {
      // Simulate preparation
      await new Promise((resolve) => setTimeout(resolve, 300))
      setStatus('generating')

      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90))
      }, 200)

      const request: POExportRequest = {
        po_ids: isUsingSelection ? selectedPoIds : undefined,
        filters: !isUsingSelection ? filters : undefined,
      }

      const blob = await exportPOs.mutateAsync(request)

      clearInterval(progressInterval)
      setProgress(100)
      setStatus('complete')

      // Trigger download
      const filename = generateExportFilename('POs_Export')
      downloadFile(blob, filename)

      // Auto-close after short delay
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to export POs')
    }
  }, [exceedsLimit, isUsingSelection, selectedPoIds, filters, exportPOs, onOpenChange])

  const handleClose = useCallback(() => {
    if (status !== 'preparing' && status !== 'generating') {
      onOpenChange(false)
    }
  }, [status, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" aria-describedby="export-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Purchase Orders
          </DialogTitle>
          <DialogDescription id="export-dialog-description">
            Export PO data to Excel with 3 sheets: Summary, Lines, and Metadata.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Export Info */}
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">POs to export:</span>
                  <Badge variant="secondary" className="text-base">
                    {exportCount}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isUsingSelection
                    ? `${selectedPoIds.length} selected POs`
                    : filters
                    ? 'All POs matching your filters'
                    : 'All Purchase Orders'}
                </p>
              </div>

              {exceedsLimit && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Export limit is {EXPORT_MAX_POS} POs. Please select fewer POs or apply filters to reduce the count.
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Export includes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Summary sheet - PO headers with totals</li>
                  <li>Lines sheet - All line items</li>
                  <li>Metadata sheet - Export info and settings</li>
                </ul>
              </div>
            </div>
          )}

          {/* Progress */}
          {(status === 'preparing' || status === 'generating') && (
            <div className="text-center py-6">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="font-medium mb-2">
                {status === 'preparing' ? 'Preparing export...' : 'Generating Excel file...'}
              </p>
              <Progress value={progress} className="w-full mb-2" aria-label="Export progress" />
              <p className="text-sm text-muted-foreground">{progress}%</p>
            </div>
          )}

          {/* Complete */}
          {status === 'complete' && (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="font-medium text-green-700">Export Complete!</p>
              <p className="text-sm text-muted-foreground">
                Your download should start automatically.
              </p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {status === 'idle' && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={exceedsLimit || exportCount === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export {exportCount} PO{exportCount !== 1 ? 's' : ''}
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Retry Export
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default POExportDialog
