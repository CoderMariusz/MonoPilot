/**
 * Attachment Upload Component
 * Story: 02.8 - Routing Operations
 * AC-18, AC-19, AC-20, AC-21: Attachments upload with validation
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  MAX_FILE_SIZE,
  MAX_ATTACHMENTS,
  ALLOWED_MIME_TYPES,
  validateAttachmentFile,
  MIME_TO_EXT,
} from '@/lib/validation/operation-schemas'

export interface Attachment {
  id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  uploaded_at: string
}

interface AttachmentUploadProps {
  routingId: string
  operationId: string
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
  disabled?: boolean
}

/**
 * Format file size to human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Get icon for file type
 */
function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />
    case 'png':
    case 'jpg':
    case 'jpeg':
      return <ImageIcon className="h-5 w-5 text-blue-500" />
    case 'docx':
      return <FileText className="h-5 w-5 text-blue-600" />
    default:
      return <File className="h-5 w-5 text-gray-500" />
  }
}

export function AttachmentUpload({
  routingId,
  operationId,
  attachments,
  onAttachmentsChange,
  disabled = false,
}: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const canUpload = attachments.length < MAX_ATTACHMENTS && !disabled

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      // Only process first file if multiple selected
      const file = files[0]

      // Validate file
      const validationError = validateAttachmentFile(file, attachments.length)
      if (validationError) {
        toast({
          title: 'Invalid File',
          description: validationError,
          variant: 'destructive',
        })
        return
      }

      // Upload file
      try {
        setUploading(true)
        setUploadProgress(0)

        const formData = new FormData()
        formData.append('file', file)

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90))
        }, 100)

        const response = await fetch(
          `/api/v1/technical/routings/${routingId}/operations/${operationId}/attachments`,
          {
            method: 'POST',
            body: formData,
          }
        )

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload attachment')
        }

        const result = await response.json()

        // Add new attachment to list
        onAttachmentsChange([...attachments, result.data])

        toast({
          title: 'Upload Complete',
          description: `${file.name} uploaded successfully`,
        })
      } catch (error) {
        console.error('Error uploading attachment:', error)
        toast({
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Failed to upload file',
          variant: 'destructive',
        })
      } finally {
        setUploading(false)
        setUploadProgress(0)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [routingId, operationId, attachments, onAttachmentsChange, toast]
  )

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (canUpload && e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [canUpload, handleFiles]
  )

  // Delete attachment
  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Delete this attachment? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(
        `/api/v1/technical/routings/${routingId}/operations/${operationId}/attachments/${attachmentId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete attachment')
      }

      // Remove from list
      onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId))

      toast({
        title: 'Deleted',
        description: 'Attachment deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting attachment:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete attachment',
        variant: 'destructive',
      })
    }
  }

  // Download attachment
  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(
        `/api/v1/technical/routings/${routingId}/operations/${operationId}/attachments/${attachment.id}/download`
      )

      if (!response.ok) {
        throw new Error('Failed to get download URL')
      }

      const result = await response.json()

      // Open in new tab
      window.open(result.data.url, '_blank')
    } catch (error) {
      console.error('Error downloading attachment:', error)
      toast({
        title: 'Error',
        description: 'Failed to download attachment',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">
        Attachments ({attachments.length}/{MAX_ATTACHMENTS})
      </label>

      {/* Upload Area */}
      {canUpload && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            uploading && 'opacity-50 pointer-events-none'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.docx"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={!canUpload || uploading}
          />

          <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />

          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop a file here, or{' '}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              click to browse
            </button>
          </p>

          <p className="text-xs text-muted-foreground">
            PDF, PNG, JPG, DOCX (max {formatFileSize(MAX_FILE_SIZE)})
          </p>

          {uploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
            </div>
          )}
        </div>
      )}

      {/* Max attachments warning */}
      {attachments.length >= MAX_ATTACHMENTS && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
          <AlertCircle className="h-4 w-4" />
          Maximum {MAX_ATTACHMENTS} attachments reached
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <Card
              key={attachment.id}
              className="flex items-center justify-between p-3"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(attachment.file_type)}
                <div>
                  <p className="text-sm font-medium">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)} -{' '}
                    {new Date(attachment.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(attachment)}
                  title="Download"
                  aria-label={`Download ${attachment.file_name}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(attachment.id)}
                    title="Delete"
                    aria-label={`Delete ${attachment.file_name}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state for no attachments */}
      {attachments.length === 0 && !canUpload && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No attachments
        </p>
      )}
    </div>
  )
}
