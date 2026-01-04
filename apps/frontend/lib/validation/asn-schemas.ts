/**
 * ASN Validation Schemas (Story 05.8)
 * Purpose: Zod validation schemas for ASN CRUD operations
 * Phase: GREEN - Minimal code to pass tests
 */

import { z } from 'zod'

// =============================================================================
// Enums
// =============================================================================

export const asnStatusEnum = z.enum(['pending', 'partial', 'received', 'cancelled'])

export type ASNStatus = z.infer<typeof asnStatusEnum>

// =============================================================================
// ASN Header Schema
// =============================================================================

export const asnSchema = z.object({
  po_id: z.string({ required_error: 'Invalid purchase order ID' }).uuid('Invalid purchase order ID'),
  expected_date: z
    .string()
    .refine(
      (date) => {
        const inputDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return inputDate >= today
      },
      { message: 'Expected delivery date must be today or in the future' }
    ),
  carrier: z.string().trim().optional(),
  tracking_number: z.string().trim().optional(),
  notes: z.string().optional(),
})

export type ASNSchema = z.infer<typeof asnSchema>

// =============================================================================
// ASN Item Schema
// =============================================================================

export const asnItemSchema = z.object({
  product_id: z.string({ required_error: 'Invalid product ID' }).uuid('Invalid product ID'),
  expected_qty: z.number().positive('Expected quantity must be greater than 0'),
  uom: z.string({ required_error: 'Unit of measure is required' }).min(1, 'Unit of measure is required'),
  supplier_lp_number: z.string().optional(),
  supplier_batch_number: z.string().optional(),
  gtin: z
    .string()
    .regex(/^\d{14}$/, 'GTIN must be 14 digits')
    .optional(),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
})

export type ASNItemSchema = z.infer<typeof asnItemSchema>

// =============================================================================
// Create ASN Schema (Header + Items)
// =============================================================================

export const createASNSchema = z.object({
  header: asnSchema,
  items: z.array(asnItemSchema).min(1, 'At least one item is required'),
})

export type CreateASNSchema = z.infer<typeof createASNSchema>

// =============================================================================
// Update ASN Schema
// =============================================================================

export const updateASNSchema = asnSchema.partial()

export type UpdateASNSchema = z.infer<typeof updateASNSchema>

// =============================================================================
// Update ASN Item Schema
// =============================================================================

export const updateASNItemSchema = asnItemSchema.partial()

export type UpdateASNItemSchema = z.infer<typeof updateASNItemSchema>

// =============================================================================
// Create ASN from PO Schema
// =============================================================================

export const createASNFromPOSchema = z.object({
  po_id: z.string().uuid('Invalid purchase order ID'),
  expected_date: z.string(),
  carrier: z.string().optional(),
  tracking_number: z.string().optional(),
  notes: z.string().optional(),
  item_overrides: z
    .array(
      z.object({
        po_line_id: z.string().uuid(),
        expected_qty: z.number().positive().optional(),
        supplier_batch_number: z.string().optional(),
        gtin: z.string().optional(),
        expiry_date: z.string().optional(),
      })
    )
    .optional(),
})

export type CreateASNFromPOSchema = z.infer<typeof createASNFromPOSchema>

// Export convenience types that match hooks/types expectations
export type UpdateASNInput = UpdateASNSchema
export type CreateASNFromPOInput = CreateASNFromPOSchema
export type CreateASNItemInput = ASNItemSchema
export type UpdateASNItemInput = UpdateASNItemSchema
