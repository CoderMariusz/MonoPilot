/**
 * GRN Validation Schemas (Story 05.10)
 * Purpose: Zod validation schemas for GRN CRUD operations
 * Phase: GREEN - Minimal code to pass tests
 */

import { z } from 'zod'

// =============================================================================
// Enums
// =============================================================================

export const grnStatusEnum = z.enum(['draft', 'completed', 'cancelled'])
export const grnSourceTypeEnum = z.enum(['po', 'to', 'production', 'return', 'adjustment'])
export const qaStatusEnum = z.enum(['pending', 'passed', 'failed', 'quarantine'])

export type GRNStatus = z.infer<typeof grnStatusEnum>
export type GRNSourceType = z.infer<typeof grnSourceTypeEnum>
export type QAStatus = z.infer<typeof qaStatusEnum>

// =============================================================================
// GRN Item Schema
// =============================================================================

export const createGRNItemSchema = z.object({
  product_id: z.string({ required_error: 'Product ID is required' }).uuid('Invalid product ID'),
  ordered_qty: z.number().nonnegative().default(0),
  received_qty: z.number().positive('Received quantity must be greater than 0'),
  uom: z.string({ required_error: 'Unit of measure is required' }).min(1, 'Unit of measure is required').max(20),
  po_line_id: z.string().uuid().nullable().optional(),
  to_line_id: z.string().uuid().nullable().optional(),
  batch_number: z.string().max(100).nullable().optional(),
  supplier_batch_number: z.string().max(100).nullable().optional(),
  gtin: z.string().regex(/^\d{14}$/, 'GTIN must be 14 digits').nullable().optional(),
  catch_weight_kg: z.number().positive().nullable().optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').nullable().optional(),
  manufacture_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').nullable().optional(),
  location_id: z.string().uuid('Invalid location ID').optional(),
  qa_status: qaStatusEnum.default('pending'),
  notes: z.string().max(500).nullable().optional(),
})

export type CreateGRNItemInput = z.infer<typeof createGRNItemSchema>

// =============================================================================
// Create GRN Schema
// =============================================================================

export const createGRNSchema = z.object({
  source_type: grnSourceTypeEnum,
  warehouse_id: z.string({ required_error: 'Warehouse ID is required' }).uuid('Invalid warehouse ID'),
  location_id: z.string({ required_error: 'Location ID is required' }).uuid('Invalid location ID'),
  po_id: z.string().uuid('Invalid PO ID').nullable().optional(),
  to_id: z.string().uuid('Invalid TO ID').nullable().optional(),
  asn_id: z.string().uuid('Invalid ASN ID').nullable().optional(),
  supplier_id: z.string().uuid('Invalid supplier ID').nullable().optional(),
  receipt_date: z.string().datetime().optional(),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(createGRNItemSchema).min(1, 'At least one item is required'),
}).refine(data => {
  // If source_type is 'po', po_id should be provided
  if (data.source_type === 'po' && !data.po_id) {
    return false
  }
  return true
}, { message: 'PO ID required for PO source type', path: ['po_id'] })
.refine(data => {
  // If source_type is 'to', to_id should be provided
  if (data.source_type === 'to' && !data.to_id) {
    return false
  }
  return true
}, { message: 'TO ID required for TO source type', path: ['to_id'] })

export type CreateGRNInput = z.infer<typeof createGRNSchema>

// =============================================================================
// Update GRN Schema
// =============================================================================

export const updateGRNSchema = z.object({
  location_id: z.string().uuid('Invalid location ID').optional(),
  notes: z.string().max(1000).nullable().optional(),
})

export type UpdateGRNInput = z.infer<typeof updateGRNSchema>

// =============================================================================
// Update GRN Item Schema
// =============================================================================

export const updateGRNItemSchema = z.object({
  received_qty: z.number().positive('Received quantity must be greater than 0').optional(),
  batch_number: z.string().max(100).nullable().optional(),
  supplier_batch_number: z.string().max(100).nullable().optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').nullable().optional(),
  manufacture_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').nullable().optional(),
  location_id: z.string().uuid('Invalid location ID').optional(),
  qa_status: qaStatusEnum.optional(),
  notes: z.string().max(500).nullable().optional(),
})

export type UpdateGRNItemInput = z.infer<typeof updateGRNItemSchema>

// =============================================================================
// Cancel GRN Schema
// =============================================================================

export const cancelGRNSchema = z.object({
  reason: z.string({ required_error: 'Cancellation reason is required' })
    .min(1, 'Cancellation reason is required')
    .max(500, 'Reason must be 500 characters or less'),
})

export type CancelGRNInput = z.infer<typeof cancelGRNSchema>

// =============================================================================
// GRN Query Params Schema
// =============================================================================

export const grnQuerySchema = z.object({
  search: z.string().min(1).optional(),
  status: grnStatusEnum.optional(),
  source_type: grnSourceTypeEnum.optional(),
  warehouse_id: z.string().uuid().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  supplier_id: z.string().uuid().optional(),
  sort: z.enum(['grn_number', 'receipt_date', 'created_at', 'total_qty']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type GRNQueryParams = z.infer<typeof grnQuerySchema>
