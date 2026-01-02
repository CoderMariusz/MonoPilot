/**
 * PO Bulk Operations - Zod Validation Schemas
 * Story: 03.6 - PO Bulk Operations
 *
 * Schemas for:
 * - BulkPOImportRowSchema (single import row)
 * - BulkCreatePORequestSchema (bulk create API request)
 * - BulkStatusUpdateSchema (bulk status update request)
 * - POExportRequestSchema (export request)
 *
 * Business Rules:
 * - Import limit: 500 rows max
 * - Export limit: 1000 POs max
 * - Bulk status update: 100 POs max
 * - Quantity: positive, max 999999.99
 * - Unit price: non-negative
 * - Notes: max 500 characters
 *
 * @module po-bulk-schemas
 */

import { z } from 'zod'
import { poStatusEnum } from './purchase-order'

/**
 * Schema for a single import row.
 * Required: product_code, quantity
 * Optional: expected_delivery, unit_price, notes, warehouse_code
 */
export const BulkPOImportRowSchema = z.object({
  product_code: z
    .string({
      required_error: 'Product code is required',
      invalid_type_error: 'Product code must be a string',
    })
    .min(1, 'Product code is required')
    .max(50, 'Product code cannot exceed 50 characters'),

  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be a positive number')
    .max(999999.99, 'Quantity cannot exceed 999,999.99'),

  expected_delivery: z
    .string()
    .refine(
      (val) => {
        if (!val) return true // optional
        // Accept YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(val)) return false
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: 'Expected delivery must be a valid date (YYYY-MM-DD)' }
    )
    .optional()
    .nullable(),

  unit_price: z
    .number()
    .nonnegative('Unit price cannot be negative')
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .nullable(),

  warehouse_code: z
    .string()
    .max(20, 'Warehouse code cannot exceed 20 characters')
    .optional()
    .nullable(),
})

/**
 * TypeScript type for a single import row
 */
export type BulkPOImportRow = z.infer<typeof BulkPOImportRowSchema>

/**
 * Schema for bulk create PO API request.
 * Contains array of products (1-500) and optional defaults.
 */
export const BulkCreatePORequestSchema = z.object({
  products: z
    .array(BulkPOImportRowSchema, {
      required_error: 'Products array is required',
      invalid_type_error: 'Products must be an array',
    })
    .min(1, 'At least one product is required')
    .max(500, 'Cannot import more than 500 products at once'),

  default_warehouse_id: z
    .string()
    .uuid('Default warehouse ID must be a valid UUID')
    .optional()
    .nullable(),

  default_expected_delivery: z
    .string()
    .refine(
      (val) => {
        if (!val) return true
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(val)) return false
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: 'Default expected delivery must be a valid date (YYYY-MM-DD)' }
    )
    .optional()
    .nullable(),
})

/**
 * TypeScript type for bulk create PO request
 */
export type BulkCreatePORequest = z.infer<typeof BulkCreatePORequestSchema>

/**
 * Valid bulk status update actions.
 * Maps to status transitions in the PO lifecycle.
 */
export const bulkActionEnum = z.enum(['approve', 'reject', 'cancel', 'confirm'], {
  errorMap: () => ({
    message: 'Action must be one of: approve, reject, cancel, confirm',
  }),
})

/**
 * TypeScript type for bulk action
 */
export type BulkAction = z.infer<typeof bulkActionEnum>

/**
 * Schema for bulk status update request.
 * Allows updating status of 1-100 POs at once.
 */
export const BulkStatusUpdateSchema = z.object({
  po_ids: z
    .array(
      z.string().uuid('Each PO ID must be a valid UUID'),
      {
        required_error: 'PO IDs array is required',
        invalid_type_error: 'PO IDs must be an array',
      }
    )
    .min(1, 'At least one PO ID is required')
    .max(100, 'Cannot update more than 100 POs at once'),

  action: bulkActionEnum,

  reason: z
    .string()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional()
    .nullable(),
})

/**
 * TypeScript type for bulk status update request
 */
export type BulkStatusUpdateRequest = z.infer<typeof BulkStatusUpdateSchema>

/**
 * Valid PO status values for export filtering.
 * Uses the existing poStatusEnum from purchase-order.ts
 */
export const exportStatusEnum = poStatusEnum

/**
 * Schema for export filters.
 * All fields are optional.
 */
export const POExportFiltersSchema = z.object({
  status: exportStatusEnum.optional(),

  supplier_id: z
    .string()
    .uuid('Supplier ID must be a valid UUID')
    .optional()
    .nullable(),

  date_from: z
    .string()
    .refine(
      (val) => {
        if (!val) return true
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(val)) return false
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: 'Date from must be a valid date (YYYY-MM-DD)' }
    )
    .optional()
    .nullable(),

  date_to: z
    .string()
    .refine(
      (val) => {
        if (!val) return true
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(val)) return false
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: 'Date to must be a valid date (YYYY-MM-DD)' }
    )
    .optional()
    .nullable(),
})

/**
 * TypeScript type for export filters
 */
export type POExportFilters = z.infer<typeof POExportFiltersSchema>

/**
 * Schema for export request.
 * Can specify PO IDs directly or use filters.
 * Export limit: 1000 POs max.
 */
export const POExportRequestSchema = z.object({
  po_ids: z
    .array(
      z.string().uuid('Each PO ID must be a valid UUID'),
      { invalid_type_error: 'PO IDs must be an array' }
    )
    .max(1000, 'Cannot export more than 1000 POs at once')
    .optional()
    .nullable(),

  filters: POExportFiltersSchema.optional().nullable(),
})

/**
 * TypeScript type for export request
 */
export type POExportRequest = z.infer<typeof POExportRequestSchema>

/**
 * Schema for import execute request.
 * Contains validated rows ready for PO creation.
 */
export const ImportExecuteRequestSchema = z.object({
  rows: z
    .array(BulkPOImportRowSchema)
    .min(1, 'At least one row is required')
    .max(500, 'Cannot import more than 500 rows at once'),

  default_warehouse_id: z
    .string()
    .uuid('Default warehouse ID must be a valid UUID')
    .optional()
    .nullable(),
})

/**
 * TypeScript type for import execute request
 */
export type ImportExecuteRequest = z.infer<typeof ImportExecuteRequestSchema>

/**
 * Response types for bulk operations (not Zod schemas, just TypeScript types)
 */

export interface BulkCreatePOResult {
  success: boolean
  pos_created: Array<{
    po_id: string
    po_number: string
    supplier_id: string
    supplier_name: string
    line_count: number
    total: number
  }>
  errors: Array<{
    product_code: string
    error: string
  }>
  total_lines: number
  total_value: number
}

export interface ImportValidationResult {
  valid_rows: number
  error_rows: number
  preview: Array<{
    row_number: number
    product_code: string
    product_name: string | null
    quantity: number
    supplier_name: string | null
    expected_delivery: string | null
    unit_price: number | null
    errors: string[]
    warnings: string[]
  }>
}

export interface BulkStatusUpdateResult {
  success_count: number
  error_count: number
  results: Array<{
    po_id: string
    po_number: string
    status?: string
    error?: string
  }>
}

export interface ParsedImportData {
  rows: BulkPOImportRow[]
  headers: string[]
  raw_data: unknown[][]
}
