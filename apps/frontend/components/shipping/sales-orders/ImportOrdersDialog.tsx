/**
 * Import Orders Dialog Component
 * Story 07.5: SO Clone/Import
 *
 * File upload and import dialog for CSV import
 * - File dropzone with drag-and-drop
 * - CSV format instructions
 * - Download sample CSV template
 * - File selection validation
 * - Error messages for invalid file
 * - Upload progress indicator
 * - Transitions to result summary after import
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, Download, File, X, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useImportSalesOrders } from '@/lib/hooks/use-sales-orders'
import { ImportResultSummary } from './ImportResultSummary'
import type { ImportDialogResult } from '@/lib/validation/sales-order-import'

// =============================================================================
// Types
// =============================================================================

type DialogStep = 'upload' | 'importing' | 'result'

interface ImportOrdersDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Callback when dialog is closed */
  onClose: () => void
}

// =============================================================================
// Constants
// =============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const SAMPLE_CSV_CONTENT = `customer_code,product_code,quantity,unit_price,customer_po,promised_ship_date,notes
CUST-001,PROD-001,100,10.50,PO-12345,2025-02-15,Rush order
CUST-001,PROD-002,50,25.00,PO-12345,2025-02-15,
CUST-002,PROD-001,200,10.00,,,Standard delivery`

// =============================================================================
// Component
// =============================================================================

export function ImportOrdersDialog({ isOpen, onClose }: ImportOrdersDialogProps) {
  const [step, setStep] = useState<DialogStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<ImportDialogResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const importMutation = useImportSalesOrders()

  // Reset dialog state
  const resetState = useCallback(() => {
    setStep('upload')
    setSelectedFile(null)
    setError(null)
    setIsDragging(false)
    setResult(null)
  }, [])

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (step === 'importing') {
      // Don't allow closing during import
      return
    }
    resetState()
    onClose()
  }, [step, resetState, onClose])

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Only CSV files are supported'
    }
    if (file.size === 0) {
      return 'File is empty'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large (max 5 MB)'
    }
    return null
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        setSelectedFile(null)
        return
      }
      setError(null)
      setSelectedFile(file)
    },
    [validateFile]
  )

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFile = e.dataTransfer.files?.[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect]
  )

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  // Handle browse click
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Clear selected file
  const handleClearFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Handle import
  const handleImport = useCallback(async () => {
    if (!selectedFile) return

    setStep('importing')
    setError(null)

    try {
      const response = await importMutation.mutateAsync(selectedFile)

      // Transform response to ImportDialogResult format
      const importResult: ImportDialogResult = {
        summary: {
          orders_created: response.ordersCreated,
          lines_imported: response.linesImported,
          errors_count: response.errorsCount,
        },
        created_orders: response.created_orders,
        errors: response.errors.map((e) => ({
          row: e.rowNumber,
          error: e.message,
        })),
      }

      setResult(importResult)
      setStep('result')

      if (response.errorsCount === 0) {
        toast.success('Import successful', {
          description: `Created ${response.ordersCreated} order(s)`,
        })
      } else if (response.ordersCreated > 0) {
        toast.warning('Import completed with errors', {
          description: `Created ${response.ordersCreated} order(s), ${response.errorsCount} row(s) skipped`,
        })
      } else {
        toast.error('Import failed', {
          description: 'No orders were created. Check errors for details.',
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import orders'
      setError(message)
      setStep('upload')
      toast.error('Import failed', { description: message })
    }
  }, [selectedFile, importMutation])

  // Download sample CSV
  const handleDownloadSample = useCallback(() => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sales-orders-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  // Get dialog title based on step
  const getDialogTitle = () => {
    switch (step) {
      case 'upload':
        return 'Import Sales Orders'
      case 'importing':
        return 'Importing Orders...'
      case 'result':
        return 'Import Complete'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-2xl"
        data-testid="import-orders-dialog"
        aria-describedby="import-orders-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" aria-hidden="true" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription id="import-orders-description">
            {step === 'upload' && 'Upload a CSV file to create multiple sales orders at once.'}
            {step === 'importing' && 'Please wait while we process your file...'}
            {step === 'result' && 'Review the import results below.'}
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4 py-2">
            {/* Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleBrowseClick}
              role="button"
              tabIndex={0}
              aria-label="Drag and drop CSV file or click to select"
              onKeyDown={(e) => e.key === 'Enter' && handleBrowseClick()}
              className={`
                rounded-lg border-2 border-dashed p-8 text-center cursor-pointer
                transition-colors duration-200
                ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }
                ${selectedFile ? 'bg-muted/30' : ''}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleInputChange}
                className="hidden"
                aria-label="Select CSV file for upload"
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <File className="h-8 w-8 text-primary" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearFile()
                    }}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              ) : (
                <>
                  <Upload
                    className="mx-auto h-10 w-10 text-muted-foreground/50"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm font-medium">
                    Drag and drop CSV file here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* CSV Format Info */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="font-medium text-sm">CSV Format</p>
              <div className="bg-background border rounded p-2 font-mono text-xs overflow-x-auto">
                customer_code,product_code,quantity,unit_price
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Required:</strong> customer_code, product_code, quantity, unit_price
                </p>
                <p>
                  <strong>Optional:</strong> customer_po, promised_ship_date (YYYY-MM-DD), notes
                </p>
                <p>
                  Orders are grouped by customer code - each unique customer creates one order.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                Download Sample CSV
              </Button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!selectedFile}>
                <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                Import
              </Button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Processing {selectedFile?.name}...
              </p>
              <Progress value={undefined} className="w-48" />
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && result && (
          <ImportResultSummary result={result} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImportOrdersDialog
