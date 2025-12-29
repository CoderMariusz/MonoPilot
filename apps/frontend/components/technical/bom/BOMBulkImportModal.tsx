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
 */

import { useState, useRef, useCallback } from 'react'
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
import type { CreateBOMItemRequest, BulkImportResponse } from '@/lib/types/bom'

interface BOMBulkImportModalProps {
  isOpen: boolean
  bomId: string
  onClose: () => void
  onSuccess?: (count: number) => void
  onError?: (error: string) => void
}

// CSV template headers
const CSV_HEADERS = [
  'product_code',
  'quantity',
  'uom',
  'sequence',
  'scrap_percent',
  'operation_seq',
  'consume_whole_lp',
  'line_ids',
  'is_by_product',
  'yield_percent',
  'condition_flags',
  'notes',
]

export function BOMBulkImportModal({
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
  const parseCSV = async (file: File): Promise<CreateBOMItemRequest[]> => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim())

    if (lines.length < 2) {
      throw new Error('CSV file must have a header row and at least one data row')
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const items: CreateBOMItemRequest[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length === 0) continue

      const item: Record<string, any> = {}

      headers.forEach((header, idx) => {
        const value = values[idx]?.trim()
        if (value === undefined || value === '') return

        switch (header) {
          case 'product_code':
          case 'product_id':
            item.product_id = value
            break
          case 'quantity':
            item.quantity = parseFloat(value)
            break
          case 'uom':
            item.uom = value
            break
          case 'sequence':
            item.sequence = parseInt(value, 10)
            break
          case 'scrap_percent':
            item.scrap_percent = parseFloat(value)
            break
          case 'operation_seq':
            if (value && value !== 'null') {
              item.operation_seq = parseInt(value, 10)
            }
            break
          case 'consume_whole_lp':
            item.consume_whole_lp = value.toLowerCase() === 'true'
            break
          case 'is_by_product':
            item.is_by_product = value.toLowerCase() === 'true'
            break
          case 'yield_percent':
            if (value && value !== 'null') {
              item.yield_percent = parseFloat(value)
            }
            break
          case 'line_ids':
            if (value && value !== 'null') {
              try {
                item.line_ids = JSON.parse(value)
              } catch {
                item.line_ids = value.split(';').filter(Boolean)
              }
            }
            break
          case 'condition_flags':
            if (value && value !== 'null') {
              try {
                item.condition_flags = JSON.parse(value)
              } catch {
                // Parse key:value pairs
                const flags: Record<string, boolean> = {}
                value.split(';').forEach((pair) => {
                  const [key, val] = pair.split(':')
                  if (key) flags[key.trim()] = val?.trim() !== 'false'
                })
                if (Object.keys(flags).length > 0) {
                  item.condition_flags = flags
                }
              }
            }
            break
          case 'notes':
            item.notes = value
            break
        }
      })

      if (item.product_id && item.quantity && item.uom) {
        items.push(item as CreateBOMItemRequest)
      }
    }

    return items
  }

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
    values.push(current)

    return values.map((v) => v.replace(/^"|"$/g, ''))
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

      if (items.length > 500) {
        throw new Error(
          'Maximum 500 items allowed per import. Please split into multiple files.'
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
  const downloadTemplate = () => {
    const headers = CSV_HEADERS.join(',')
    const example1 =
      'RM-001,50,kg,10,2,,false,,false,,,Premium ingredient'
    const example2 =
      'BP-001,2,kg,100,0,,false,,true,2.0,,"Byproduct output"'
    const csv = `${headers}\n${example1}\n${example2}`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bom-items-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Download error report
  const downloadErrorReport = () => {
    if (!result?.errors.length) return

    const headers = 'Row,Error\n'
    const rows = result.errors
      .map((e) => `${e.row},"${e.error.replace(/"/g, '""')}"`)
      .join('\n')
    const csv = headers + rows

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-errors.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
            Upload a CSV file with BOM items. Maximum 500 items per import.
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
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {err.error}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>... and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
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
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {err.error}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>... and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
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
}
