'use client'

/**
 * BOMBulkImportModal Component (Story 02.5b)
 *
 * Modal for bulk importing BOM items from CSV:
 * - File upload (CSV format, max 500 items)
 * - CSV template download
 * - Import progress display
 * - Success/error/partial success handling
 * - Error report with row numbers
 *
 * Uses centralized utilities:
 * - CSV parsing from lib/utils/csv-parser.ts
 * - Constants from lib/constants/bom-items.ts
 */

import { useState, useRef, useCallback, memo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  X,
  FileSpreadsheet,
} from 'lucide-react'
import { bulkCreateBOMItems } from '@/lib/services/bom-items-service'
import {
  parseCSVLine,
  parseBoolean,
  parseNumber,
  parseInt as parseIntValue,
  parseArray,
  parseKeyValuePairs,
} from '@/lib/utils/csv-parser'
import { CSV_TEMPLATE, BOM_ITEM_LIMITS } from '@/lib/constants/bom-items'
import type { CreateBOMItemRequest, BulkImportResponse } from '@/lib/types/bom'

interface BOMBulkImportModalProps {
  isOpen: boolean
  bomId: string
  onClose: () => void
  onSuccess?: (count: number) => void
  onError?: (error: string) => void
}

/**
 * Parse a single CSV row into a BOM item request
 * @param values - Parsed CSV values array
 * @param headers - Column headers (lowercase)
 * @returns Parsed item or null if invalid
 */
function parseBOMItemFromCSV(
  values: string[],
  headers: string[]
): CreateBOMItemRequest | null {
  const item: Record<string, unknown> = {}

  headers.forEach((header, idx) => {
    const value = values[idx]?.trim()
    if (value === undefined || value === '') return

    switch (header) {
      case 'product_code':
      case 'product_id':
        item.product_id = value
        break
      case 'quantity':
        item.quantity = parseNumber(value)
        break
      case 'uom':
        item.uom = value
        break
      case 'sequence':
        item.sequence = parseIntValue(value)
        break
      case 'scrap_percent':
        item.scrap_percent = parseNumber(value)
        break
      case 'operation_seq':
        item.operation_seq = parseIntValue(value)
        break
      case 'consume_whole_lp':
        item.consume_whole_lp = parseBoolean(value)
        break
      case 'is_by_product':
        item.is_by_product = parseBoolean(value)
        break
      case 'yield_percent':
        item.yield_percent = parseNumber(value)
        break
      case 'line_ids':
        item.line_ids = parseArray(value)
        break
      case 'condition_flags':
        item.condition_flags = parseKeyValuePairs(value)
        break
      case 'notes':
        item.notes = value
        break
    }
  })

  // Validate required fields
  if (item.product_id && item.quantity && item.uom) {
    return item as CreateBOMItemRequest
  }

  return null
}

/**
 * Download a file with the given content
 */
function downloadFile(content: string, filename: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const BOMBulkImportModal = memo(function BOMBulkImportModal({
  isOpen,
  bomId,
  onClose,
  onSuccess,
  onError,
}: BOMBulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkImportResponse | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens
  const resetState = useCallback(() => {
    setFile(null)
    setIsUploading(false)
    setProgress(0)
    setError(null)
    setResult(null)
    setIsDragging(false)
  }, [])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  // Validate file type
  const validateAndSetFile = (selectedFile: File) => {
    const validExtensions = ['.csv', '.tsv']
    const hasValidExt = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    )

    if (!hasValidExt) {
      setError('Please select a CSV or TSV file')
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError(null)
    setResult(null)
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  // Parse CSV file
  const parseCSV = async (csvFile: File): Promise<CreateBOMItemRequest[]> => {
    const text = await csvFile.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim())

    if (lines.length < 2) {
      throw new Error('CSV file must have a header row and at least one data row')
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase())
    const items: CreateBOMItemRequest[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length === 0 || values.every((v) => !v.trim())) continue

      const item = parseBOMItemFromCSV(values, headers)
      if (item) {
        items.push(item)
      }
    }

    return items
  }

  // Handle import
  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    setProgress(10)
    setError(null)

    try {
      // Parse CSV
      setProgress(30)
      const items = await parseCSV(file)

      if (items.length === 0) {
        throw new Error('No valid items found in CSV file')
      }

      if (items.length > BOM_ITEM_LIMITS.MAX_BULK_IMPORT) {
        throw new Error(
          `Maximum ${BOM_ITEM_LIMITS.MAX_BULK_IMPORT} items allowed per import. Please split into multiple files.`
        )
      }

      // Upload
      setProgress(60)
      const response = await bulkCreateBOMItems(bomId, items)

      setProgress(100)
      setResult(response)

      if (response.errors.length === 0) {
        // Full success - call onSuccess after delay
        setTimeout(() => {
          onSuccess?.(response.created)
        }, 1500)
      } else if (response.created > 0) {
        // Partial success
        onSuccess?.(response.created)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setError(message)
      onError?.(message)
    } finally {
      setIsUploading(false)
    }
  }

  // Download CSV template
  const downloadTemplate = useCallback(() => {
    const headers = CSV_TEMPLATE.HEADERS.join(',')
    const examples = CSV_TEMPLATE.EXAMPLES.join('\n')
    const csv = `${headers}\n${examples}`
    downloadFile(csv, CSV_TEMPLATE.FILENAME)
  }, [])

  // Download error report
  const downloadErrorReport = useCallback(() => {
    if (!result?.errors.length) return

    const headers = 'Row,Error\n'
    const rows = result.errors
      .map((e) => `${e.row},"${e.error.replace(/"/g, '""')}"`)
      .join('\n')
    const csv = headers + rows

    downloadFile(csv, CSV_TEMPLATE.ERROR_FILENAME)
  }, [result])

  // Handle close with confirmation
  const handleClose = () => {
    if (isUploading) {
      if (!confirm('Import in progress. Are you sure you want to cancel?')) {
        return
      }
    }
    resetState()
    onClose()
  }

  // Determine result state
  const isSuccess = result && result.errors.length === 0
  const isPartialSuccess = result && result.errors.length > 0 && result.created > 0
  const isFullFailure = result && result.created === 0 && result.errors.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import BOM Items</DialogTitle>
          <DialogDescription>
            Upload a CSV file with BOM items. Maximum {BOM_ITEM_LIMITS.MAX_BULK_IMPORT} items per import.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template download */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with the required columns.
            </p>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>

          {/* File upload area */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'hover:border-primary'}
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Upload CSV file"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isUploading) {
                fileInputRef.current?.click()
              }
            }}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    setResult(null)
                    setError(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">
                  Click to select or drag-drop a CSV file
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>

          {/* Progress indicator */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Importing items... {progress}%
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {isSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">
                {result.created} item{result.created !== 1 ? 's' : ''} imported
                successfully.
              </AlertDescription>
            </Alert>
          )}

          {/* Partial success */}
          {isPartialSuccess && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">
                Partial Success
              </AlertTitle>
              <AlertDescription className="text-yellow-700">
                <p>
                  {result.created} of {result.total} items imported.{' '}
                  {result.errors.length} error
                  {result.errors.length !== 1 ? 's' : ''}.
                </p>
                <ErrorList errors={result.errors} />
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 p-0 h-auto text-yellow-700"
                  onClick={downloadErrorReport}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download error report
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Full failure */}
          {isFullFailure && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Failed</AlertTitle>
              <AlertDescription>
                <p>
                  No items were imported. {result.errors.length} error
                  {result.errors.length !== 1 ? 's' : ''} found.
                </p>
                <ErrorList errors={result.errors} />
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 p-0 h-auto"
                  onClick={downloadErrorReport}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download error report
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || isUploading}>
              {isUploading ? 'Importing...' : 'Import Items'}
            </Button>
          )}
          {result && result.created > 0 && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

/**
 * Error list component showing first 5 errors with "and more" indicator
 */
interface ImportError {
  row: number
  error: string
}

interface ErrorListProps {
  errors: ImportError[]
  maxDisplay?: number
}

const ErrorList = memo(function ErrorList({ errors, maxDisplay = 5 }: ErrorListProps) {
  return (
    <div className="mt-2 max-h-32 overflow-y-auto">
      <ul className="list-disc list-inside text-sm space-y-1">
        {errors.slice(0, maxDisplay).map((err, i) => (
          <li key={i}>
            Row {err.row}: {err.error}
          </li>
        ))}
        {errors.length > maxDisplay && (
          <li>... and {errors.length - maxDisplay} more errors</li>
        )}
      </ul>
    </div>
  )
})
