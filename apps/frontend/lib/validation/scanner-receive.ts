/**
 * Scanner Receive Validation Schemas (Story 05.19)
 * Purpose: Zod validation schemas for scanner receive operations
 */

import { z } from 'zod'

// =============================================================================
// Scanner Receive Request Schema
// =============================================================================

export const scannerReceiveSchema = z.object({
  po_id: z.string({ required_error: 'PO ID is required' }).uuid('Invalid PO ID'),
  po_line_id: z.string({ required_error: 'PO line ID is required' }).uuid('Invalid PO line ID'),
  warehouse_id: z.string({ required_error: 'Warehouse ID is required' }).uuid('Invalid warehouse ID'),
  location_id: z.string({ required_error: 'Location ID is required' }).uuid('Invalid location ID'),
  received_qty: z.number({ required_error: 'Quantity is required' })
    .positive('Quantity must be positive')
    .max(999999999, 'Quantity too large'),
  batch_number: z.string()
    .max(100, 'Batch number max 100 characters')
    .optional()
    .nullable(),
  supplier_batch_number: z.string()
    .max(100, 'Supplier batch max 100 characters')
    .optional()
    .nullable(),
  expiry_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  manufacture_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  notes: z.string()
    .max(500, 'Notes max 500 characters')
    .optional()
    .nullable(),
})

export type ScannerReceiveInput = z.infer<typeof scannerReceiveSchema>

// =============================================================================
// Validate Receipt Schema (Pre-validation)
// =============================================================================

export const validateReceiptSchema = z.object({
  po_id: z.string().uuid('Invalid PO ID'),
  po_line_id: z.string().uuid('Invalid PO line ID'),
  received_qty: z.number().positive('Quantity must be positive'),
  batch_number: z.string().max(100).optional().nullable(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
})

export type ValidateReceiptInput = z.infer<typeof validateReceiptSchema>

// =============================================================================
// Barcode Lookup Schema
// =============================================================================

export const barcodeLookupSchema = z.object({
  barcode: z.string({ required_error: 'Barcode is required' })
    .min(1, 'Barcode required')
    .max(100, 'Barcode too long'),
  type: z.enum(['po', 'product', 'location']).optional(),
})

export type BarcodeLookupInput = z.infer<typeof barcodeLookupSchema>

// =============================================================================
// Pending Receipts Query Schema
// =============================================================================

export const pendingReceiptsQuerySchema = z.object({
  warehouse_id: z.string().uuid('Invalid warehouse ID').optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit max 100').default(50),
})

export type PendingReceiptsQuery = z.infer<typeof pendingReceiptsQuerySchema>

// =============================================================================
// Response Types
// =============================================================================

export interface ValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
  warnings: Array<{ field: string; message: string }>
}

export interface ScannerReceiveResult {
  grn: {
    id: string
    grn_number: string
    receipt_date: string
    status: 'completed'
  }
  lp: {
    id: string
    lp_number: string
    product_name: string
    quantity: number
    uom: string
    batch_number: string | null
    expiry_date: string | null
    location_path: string
  }
  poLineStatus: 'partial' | 'complete'
  poStatus: 'partial' | 'closed'
  printJobId: string | null
  overReceipt?: {
    orderedQty: number
    totalReceived: number
    overReceiptPct: number
  }
}

export interface PendingReceiptSummary {
  id: string
  po_number: string
  supplier_name: string
  expected_date: string
  lines_total: number
  lines_pending: number
  total_qty_ordered: number
  total_qty_received: number
}

export interface BarcodeLookupResult {
  type: 'po' | 'product' | 'location'
  found: boolean
  data?: unknown
  error?: string
}

export interface POLineForScanner {
  id: string
  product_id: string
  product_code: string
  product_name: string
  ordered_qty: number
  received_qty: number
  remaining_qty: number
  uom: string
}
