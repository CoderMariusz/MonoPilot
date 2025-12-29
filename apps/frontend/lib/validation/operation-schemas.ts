/**
 * Operation Validation Schemas - Story 02.8
 *
 * Zod schemas for routing operation validation:
 * - Operation form validation (sequence, name, times, etc.)
 * - Attachment validation (file type, size)
 * - Reorder direction validation
 */

import { z } from 'zod'

// ============================================================================
// OPERATION FORM SCHEMA
// ============================================================================

/**
 * Operation form validation schema
 * - sequence: positive integer (can duplicate for parallel ops)
 * - name: 3-100 chars required
 * - duration: positive integer required
 * - setup_time/cleanup_time: non-negative, default 0
 * - machine_id: optional UUID
 * - instructions: max 2000 chars
 */
export const operationFormSchema = z.object({
  sequence: z
    .number()
    .int('Sequence must be an integer')
    .min(1, 'Sequence must be at least 1'),

  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters'),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .nullable()
    .optional(),

  machine_id: z
    .string()
    .uuid('Invalid machine ID')
    .nullable()
    .optional(),

  setup_time: z
    .number()
    .int('Setup time must be an integer')
    .min(0, 'Setup time cannot be negative')
    .default(0),

  duration: z
    .number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 minute'),

  cleanup_time: z
    .number()
    .int('Cleanup time must be an integer')
    .min(0, 'Cleanup time cannot be negative')
    .default(0),

  labor_cost_per_hour: z
    .number()
    .min(0, 'Labor cost cannot be negative')
    .default(0),

  instructions: z
    .string()
    .max(2000, 'Instructions must be less than 2000 characters')
    .nullable()
    .optional(),
})

export type OperationFormValues = z.infer<typeof operationFormSchema>

// ============================================================================
// ATTACHMENT VALIDATION
// ============================================================================

/** Allowed MIME types for operation attachments */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

/** Map MIME type to file extension */
export const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

/** Maximum file size: 10MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/** Maximum attachments per operation */
export const MAX_ATTACHMENTS = 5

/**
 * Attachment validation schema
 * - file: max 10MB, PDF/PNG/JPG/DOCX only
 */
export const attachmentSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      'File size must be less than 10MB'
    )
    .refine(
      (file) => ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number]),
      'File type not allowed (PDF, PNG, JPG, DOCX only)'
    ),
})

export type AttachmentValues = z.infer<typeof attachmentSchema>

// ============================================================================
// REORDER SCHEMA
// ============================================================================

/**
 * Reorder direction validation
 */
export const reorderSchema = z.object({
  direction: z.enum(['up', 'down'], {
    errorMap: () => ({ message: "Direction must be 'up' or 'down'" }),
  }),
})

export type ReorderValues = z.infer<typeof reorderSchema>

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate file for attachment upload
 * Returns error message or null if valid
 */
export function validateAttachmentFile(
  file: File,
  currentCount: number
): string | null {
  if (currentCount >= MAX_ATTACHMENTS) {
    return 'Maximum 5 attachments per operation'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 10MB'
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return 'File type not allowed (PDF, PNG, JPG, DOCX only)'
  }

  return null
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string | null {
  return MIME_TO_EXT[mimeType] || null
}
