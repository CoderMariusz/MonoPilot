/**
 * Label Print Validation Schemas (Story 05.14)
 * Purpose: Zod validation schemas for LP label printing
 *
 * Exports:
 * - printLabelQuerySchema - Query params for single LP print
 * - printBulkLabelsSchema - Request body for bulk print
 * - labelSettingsSchema - Warehouse label settings
 * - labelSizeEnum - Valid label sizes
 *
 * AC Coverage:
 * - AC-11: Validate copies 1-100
 * - AC-4: Label settings validation
 */

import { z } from 'zod'

// =============================================================================
// Enum Schemas
// =============================================================================

export const labelSizeEnum = z.enum(['4x6', '4x3', '3x2'])
export const labelFormatEnum = z.enum(['zpl', 'pdf'])
export const bulkFormatEnum = z.enum(['zip', 'concat'])
export const printMethodEnum = z.enum(['download', 'tcp', 'queue'])

// =============================================================================
// Print Label Query Schema (Single LP)
// =============================================================================

/**
 * Query parameters for POST /api/warehouse/lps/:id/print-label
 * AC-11: Validates copies between 1 and 100
 */
export const printLabelQuerySchema = z.object({
  copies: z
    .coerce.number()
    .int('Copies must be an integer')
    .min(1, 'Copies must be at least 1')
    .max(100, 'Copies must be at most 100')
    .default(1),
  format: labelFormatEnum.default('zpl'),
})

// =============================================================================
// Print Bulk Labels Schema
// =============================================================================

/**
 * Request body for POST /api/warehouse/lps/print-bulk
 * AC-6: Bulk print for multiple LPs
 */
export const printBulkLabelsSchema = z.object({
  lp_ids: z
    .array(z.string().uuid('Invalid LP ID'))
    .min(1, 'At least one LP required')
    .max(100, 'Maximum 100 LPs per bulk request'),
  copies: z
    .number()
    .int('Copies must be an integer')
    .min(1, 'Copies must be at least 1')
    .max(100, 'Copies must be at most 100')
    .optional()
    .default(1),
  format: bulkFormatEnum.default('zip'),
})

// =============================================================================
// Label Settings Schema
// =============================================================================

/**
 * Warehouse settings for label printing
 * AC-4: Label settings in warehouse_settings
 */
export const labelSettingsSchema = z.object({
  print_label_on_receipt: z.boolean().default(true),
  label_copies_default: z
    .number()
    .int('Copies must be an integer')
    .min(1, 'Copies must be at least 1')
    .max(10, 'Default copies must be at most 10')
    .default(1),
  label_size: labelSizeEnum.default('4x6'),
  printer_ip: z.string().ip().nullable().optional(),
  printer_port: z
    .number()
    .int('Port must be an integer')
    .min(1, 'Port must be at least 1')
    .max(65535, 'Port must be at most 65535')
    .default(9100),
})

// =============================================================================
// LP Label Data Schema (for service layer)
// =============================================================================

/**
 * Label data structure for ZPL generation
 */
export const lpLabelDataSchema = z.object({
  lp_number: z.string().min(1, 'LP number is required'),
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  uom: z.string().min(1, 'UoM is required'),
  batch_number: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  manufacture_date: z.string().nullable().optional(),
  location_path: z.string().nullable().optional(),
  qr_data: z.string().optional(),
})

// =============================================================================
// Label Generation Options Schema
// =============================================================================

/**
 * Options for ZPL generation
 */
export const labelGenerationOptionsSchema = z.object({
  copies: z.number().int().min(1).max(100).default(1),
  label_size: labelSizeEnum.default('4x6'),
  include_qr: z.boolean().default(true),
  concat: z.boolean().default(false),
})

// =============================================================================
// Print Label Response Schema
// =============================================================================

/**
 * Response from print label API
 */
export const printLabelResponseSchema = z.object({
  zpl: z.string(),
  lp_number: z.string(),
  product_name: z.string(),
  copies: z.number(),
  label_size: labelSizeEnum,
  generated_at: z.string().datetime(),
  download_filename: z.string(),
})

// =============================================================================
// Print Bulk Labels Response Schema
// =============================================================================

/**
 * Response from bulk print API
 */
export const printBulkLabelsResponseSchema = z.object({
  format: bulkFormatEnum,
  total_labels: z.number(),
  total_copies: z.number(),
  file_size_bytes: z.number(),
  download_url: z.string().url().optional(),
  zpl: z.string().optional(),
})

// =============================================================================
// Print Log Schema
// =============================================================================

/**
 * Label print audit log entry
 */
export const labelPrintLogSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  lp_id: z.string().uuid().nullable(),
  pallet_id: z.string().uuid().nullable(),
  label_type: z.enum(['lp', 'pallet', 'grn']),
  copies: z.number().int().positive(),
  printed_at: z.string().datetime(),
  printed_by: z.string().uuid().nullable(),
  auto_print: z.boolean().default(false),
  printer_ip: z.string().ip().nullable(),
  print_method: printMethodEnum.default('download'),
})

// =============================================================================
// Type Exports
// =============================================================================

export type LabelSize = z.infer<typeof labelSizeEnum>
export type LabelFormat = z.infer<typeof labelFormatEnum>
export type BulkFormat = z.infer<typeof bulkFormatEnum>
export type PrintMethod = z.infer<typeof printMethodEnum>

export type PrintLabelQueryParams = z.infer<typeof printLabelQuerySchema>
export type PrintBulkLabelsInput = z.infer<typeof printBulkLabelsSchema>
export type LabelSettings = z.infer<typeof labelSettingsSchema>
export type LPLabelData = z.infer<typeof lpLabelDataSchema>
export type LabelGenerationOptions = z.infer<typeof labelGenerationOptionsSchema>
export type PrintLabelResponse = z.infer<typeof printLabelResponseSchema>
export type PrintBulkLabelsResponse = z.infer<typeof printBulkLabelsResponseSchema>
export type LabelPrintLog = z.infer<typeof labelPrintLogSchema>
