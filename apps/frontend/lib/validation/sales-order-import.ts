/**
 * Sales Order Import Validation Schemas
 * Story: 07.5 - SO Clone/Import
 *
 * Provides Zod validation schemas for:
 * - csvRowSchema: Validate individual CSV row data
 * - csvFileSchema: Validate CSV file metadata (type, size)
 * - csvHeadersSchema: Validate required CSV column headers
 * - importResultSchema: Validate import result response
 */

import { z } from 'zod'

// ============================================================================
// CSV Row Schema - Validates individual row data
// ============================================================================

/**
 * Schema for validating a single CSV row
 *
 * Required Fields:
 * - customer_code: Non-empty string identifying the customer
 * - product_code: Non-empty string identifying the product
 * - quantity: Positive number (> 0)
 * - unit_price: Non-negative number (>= 0, allows free items)
 *
 * Optional Fields:
 * - customer_po: Customer PO number (empty string treated as null)
 * - promised_ship_date: Date in YYYY-MM-DD format
 * - notes: Free-text notes
 */
export const csvRowSchema = z.object({
  customer_code: z
    .string()
    .min(1, 'Customer code is required'),
  product_code: z
    .string()
    .min(1, 'Product code is required'),
  quantity: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Quantity must be a valid number',
    })
    .transform((val) => parseFloat(val))
    .refine((val) => val > 0, {
      message: 'Quantity must be greater than 0',
    }),
  unit_price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Unit price must be a valid number',
    })
    .transform((val) => parseFloat(val))
    .refine((val) => val >= 0, {
      message: 'Unit price must be 0 or greater',
    }),
  customer_po: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  promised_ship_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        // Validate YYYY-MM-DD format
        return /^\d{4}-\d{2}-\d{2}$/.test(val)
      },
      { message: 'Date must be in YYYY-MM-DD format' }
    )
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  notes: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
})

export type CSVRowInput = z.input<typeof csvRowSchema>
export type CSVRowOutput = z.infer<typeof csvRowSchema>

// ============================================================================
// CSV File Schema - Validates file metadata
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const VALID_MIME_TYPES = ['text/csv', 'application/csv', 'application/vnd.ms-excel']

/**
 * Schema for validating CSV file upload
 *
 * Validations:
 * - File type must be CSV (text/csv or application/csv)
 * - File size must be > 0 (not empty)
 * - File size must be <= 5 MB
 */
export const csvFileSchema = z.object({
  type: z
    .string()
    .refine(
      (val) => VALID_MIME_TYPES.includes(val) || val.includes('csv'),
      { message: 'Only CSV files are supported' }
    ),
  size: z
    .number()
    .min(1, 'File is empty')
    .max(MAX_FILE_SIZE, 'File size must be 5 MB or less'),
  name: z.string(),
})

export type CSVFileInput = z.infer<typeof csvFileSchema>

// ============================================================================
// CSV Headers Schema - Validates required column headers
// ============================================================================

const REQUIRED_HEADERS = ['customer_code', 'product_code', 'quantity', 'unit_price'] as const
const OPTIONAL_HEADERS = ['customer_po', 'promised_ship_date', 'notes'] as const
const ALL_VALID_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS] as const

/**
 * Schema for validating CSV column headers
 *
 * Required headers: customer_code, product_code, quantity, unit_price
 * Optional headers: customer_po, promised_ship_date, notes
 */
export const csvHeadersSchema = z
  .array(z.string())
  .refine(
    (headers) => {
      const normalizedHeaders = headers.map((h) => h.toLowerCase().trim())
      return REQUIRED_HEADERS.every((req) => normalizedHeaders.includes(req))
    },
    {
      message: `Missing required columns: ${REQUIRED_HEADERS.join(', ')}`,
    }
  )

export type CSVHeaders = z.infer<typeof csvHeadersSchema>

// ============================================================================
// Import Result Schema - Validates API response
// ============================================================================

/**
 * Schema for import result error items
 */
export const importErrorSchema = z.object({
  rowNumber: z.number(),
  message: z.string(),
})

/**
 * Schema for import result response
 *
 * Fields:
 * - success: Boolean indicating overall success
 * - ordersCreated: Number of sales orders created
 * - linesImported: Number of order lines imported
 * - errorsCount: Number of rows with errors
 * - errors: Array of error details with row numbers
 * - createdOrderNumbers: List of created SO numbers
 */
export const importResultSchema = z.object({
  success: z.boolean(),
  ordersCreated: z.number().int().min(0),
  linesImported: z.number().int().min(0),
  errorsCount: z.number().int().min(0),
  errors: z.array(importErrorSchema),
  createdOrderNumbers: z.array(z.string()),
})

export type ImportResult = z.infer<typeof importResultSchema>
export type ImportError = z.infer<typeof importErrorSchema>

// ============================================================================
// CSV Preview Row Type
// ============================================================================

export interface CSVPreviewRow {
  row: number
  customer_code: string
  product_code: string
  quantity: string
  unit_price?: string
  valid: boolean
  error?: string
}

// ============================================================================
// Import Dialog Types
// ============================================================================

export interface ImportDialogResult {
  summary: {
    orders_created: number
    lines_imported: number
    errors_count: number
  }
  created_orders: Array<{
    id: string
    order_number: string
    customer_code: string
    lines_count: number
  }>
  errors: Array<{
    row: number
    error: string
  }>
}

// ============================================================================
// Constants
// ============================================================================

export const CSV_IMPORT_CONSTANTS = {
  MAX_FILE_SIZE,
  VALID_MIME_TYPES,
  REQUIRED_HEADERS,
  OPTIONAL_HEADERS,
  ALL_VALID_HEADERS,
} as const
