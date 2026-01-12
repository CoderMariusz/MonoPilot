/**
 * GRN Validation Schemas (Story 05.11)
 * Purpose: Zod validation schemas for GRN CRUD and receipt operations
 */

import { z } from 'zod'

// =============================================================================
// Enums
// =============================================================================

export const grnSourceTypeEnum = z.enum(['po', 'to', 'asn', 'return'])
export const grnStatusEnum = z.enum(['draft', 'completed', 'cancelled'])
export const qaStatusEnum = z.enum(['pending', 'passed', 'failed', 'quarantine'])

// =============================================================================
// Create GRN from PO
// =============================================================================

export const createGRNItemSchema = z.object({
  po_line_id: z.string().uuid('Invalid PO line ID'),
  received_qty: z
    .number()
    .positive('Received quantity must be positive')
    .max(999999999, 'Quantity too large'),
  batch_number: z
    .string()
    .max(100, 'Batch number max 100 characters')
    .nullable()
    .optional(),
  supplier_batch_number: z
    .string()
    .max(100, 'Supplier batch number max 100 characters')
    .nullable()
    .optional(),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .nullable()
    .optional(),
  manufacture_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .nullable()
    .optional(),
  location_id: z.string().uuid('Invalid location ID').optional(),
  notes: z.string().max(500).nullable().optional(),
})

export const createGRNFromPOSchema = z.object({
  warehouse_id: z.string().uuid('Invalid warehouse ID'),
  location_id: z.string().uuid('Invalid location ID'),
  notes: z.string().max(2000).optional(),
  items: z
    .array(createGRNItemSchema)
    .min(1, 'At least one item required')
    .max(100, 'Maximum 100 items per GRN'),
})

// =============================================================================
// Create GRN from TO (Story 05.12)
// =============================================================================

export const createGRNItemFromTOSchema = z.object({
  to_line_id: z.string().uuid('Invalid TO line ID'),
  received_qty: z
    .number()
    .positive('Received quantity must be positive')
    .max(999999999, 'Quantity too large'),
  variance_reason: z
    .string()
    .max(500, 'Variance reason max 500 characters')
    .nullable()
    .optional(),
  batch_number: z
    .string()
    .max(100, 'Batch number max 100 characters')
    .nullable()
    .optional(),
  supplier_batch_number: z
    .string()
    .max(100, 'Supplier batch number max 100 characters')
    .nullable()
    .optional(),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .nullable()
    .optional(),
  manufacture_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .nullable()
    .optional(),
  location_id: z.string().uuid('Invalid location ID').optional(),
  notes: z.string().max(500).nullable().optional(),
})

export const createGRNFromTOSchema = z.object({
  warehouse_id: z.string().uuid('Invalid warehouse ID'),
  location_id: z.string().uuid('Invalid location ID'),
  notes: z.string().max(2000).optional(),
  items: z
    .array(createGRNItemFromTOSchema)
    .min(1, 'At least one item required')
    .max(100, 'Maximum 100 items per GRN'),
})

// =============================================================================
// Receivable TOs Query (Story 05.12)
// =============================================================================

export const receivableTOsQuerySchema = z.object({
  search: z.string().min(1).optional(),
  warehouse_id: z.string().uuid().optional(), // destination warehouse
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort: z
    .enum(['to_number', 'actual_ship_date', 'planned_receive_date', 'created_at'])
    .default('actual_ship_date'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

// =============================================================================
// GRN List Query
// =============================================================================

export const grnListQuerySchema = z.object({
  status: grnStatusEnum.optional(),
  source_type: grnSourceTypeEnum.optional(),
  po_id: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().min(1).optional(),
  sort: z
    .enum(['grn_number', 'receipt_date', 'created_at'])
    .default('receipt_date'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

// =============================================================================
// Receivable POs Query
// =============================================================================

export const receivablePOsQuerySchema = z.object({
  search: z.string().min(1).optional(),
  supplier_id: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort: z
    .enum(['po_number', 'expected_date', 'created_at', 'supplier_name'])
    .default('expected_date'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

// =============================================================================
// Validate Receipt Request
// =============================================================================

export const validateReceiptSchema = z.object({
  po_id: z.string().uuid('Invalid PO ID'),
  warehouse_id: z.string().uuid('Invalid warehouse ID'),
  location_id: z.string().uuid('Invalid location ID'),
  items: z.array(createGRNItemSchema).min(1, 'At least one item required'),
})

// =============================================================================
// Type Exports
// =============================================================================

export type GRNSourceType = z.infer<typeof grnSourceTypeEnum>
export type GRNStatus = z.infer<typeof grnStatusEnum>
export type QAStatus = z.infer<typeof qaStatusEnum>
export type CreateGRNItemInput = z.infer<typeof createGRNItemSchema>
export type CreateGRNFromPOInput = z.infer<typeof createGRNFromPOSchema>
export type CreateGRNItemFromTOInput = z.infer<typeof createGRNItemFromTOSchema>
export type CreateGRNFromTOInput = z.infer<typeof createGRNFromTOSchema>
export type GRNListQueryParams = z.infer<typeof grnListQuerySchema>
export type ReceivablePOsQueryParams = z.infer<typeof receivablePOsQuerySchema>
export type ReceivableTOsQueryParams = z.infer<typeof receivableTOsQuerySchema>
export type ValidateReceiptInput = z.infer<typeof validateReceiptSchema>
