/**
 * Import Wizard Step 1: File Upload
 * Story: 03.6 - PO Bulk Operations
 * Drag-drop file upload with template download per PLAN-007
 */

'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Download, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  IMPORT_FILE_MAX_SIZE,
  IMPORT_TEMPLATE_COLUMNS,
  isValidFileType,
  isValidFileSize,
  formatFileSize,
} from '@/lib/types/po-bulk'

interface ImportWizardStepUploadProps {
  onFileSelect: (file: File) => void
  onDownloadTemplate: () => void
  isDownloadingTemplate?: boolean
  className?: string
}

export function ImportWizardStepUpload({
  onFileSelect,
  onDownloadTemplate,
  isDownloadingTemplate = false,
  className,
}: ImportWizardStepUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndSelectFile = useCallback(
    (file: File) => {
      setError(null)

      // Validate file type
      if (!isValidFileType(file)) {
        setError('Unsupported file type. Please upload .xlsx, .xls, or .csv file')
        return
      }

      // Validate file size
      if (!isValidFileSize(file)) {
        setError(`File size exceeds ${formatFileSize(IMPORT_FILE_MAX_SIZE)} limit`)
        return
      }

      setSelectedFile(file)
      onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        validateAndSelectFile(file)
      }
    },
    [validateAndSelectFile]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        validateAndSelectFile(file)
      }
    },
    [validateAndSelectFile]
  )

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleClearFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className={className}>
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-auto p-1"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
      >
        <CardContent className="p-8">
          <div
            className="flex flex-col items-center justify-center text-center"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="File upload zone, drag and drop or click to browse"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleBrowseClick()
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
              className="hidden"
              aria-hidden="true"
            />

            {selectedFile ? (
              <>
                <FileSpreadsheet className="h-12 w-12 text-green-600 mb-4" />
                <p className="text-lg font-medium text-green-700">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {formatFileSize(selectedFile.size)}
                </p>
                <Button variant="outline" size="sm" onClick={handleClearFile}>
                  Choose Different File
                </Button>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Drag & drop Excel file here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Supported: .xlsx, .xls, .csv | Max size: {formatFileSize(IMPORT_FILE_MAX_SIZE)}
                </p>
                <Button variant="outline" onClick={handleBrowseClick}>
                  Browse Files
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Download Template Button */}
      <div className="flex justify-center mt-4">
        <Button
          variant="link"
          onClick={onDownloadTemplate}
          disabled={isDownloadingTemplate}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isDownloadingTemplate ? 'Downloading...' : 'Download Template'}
        </Button>
      </div>

      {/* Template Format Documentation */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">Template Format:</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column</TableHead>
                <TableHead className="w-24">Required</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {IMPORT_TEMPLATE_COLUMNS.map((col) => (
                <TableRow key={col.name}>
                  <TableCell className="font-mono text-sm">{col.name}</TableCell>
                  <TableCell>
                    {col.required ? (
                      <span className="text-red-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{col.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {col.name === 'product_code' && 'RM-FLOUR-001'}
                    {col.name === 'quantity' && '500'}
                    {col.name === 'unit_price' && '1.20'}
                    {col.name === 'supplier_code' && 'SUP-001'}
                    {col.name === 'expected_date' && '2024-12-20'}
                    {col.name === 'notes' && 'Urgent order'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ImportWizardStepUpload
