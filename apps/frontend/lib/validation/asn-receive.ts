/**
 * ASN Receive Validation Schemas (Story 05.9)
 * Purpose: Zod validation schemas for ASN receive operations
 * Phase: GREEN - Minimal code to pass tests
 */

import { z } from 'zod'

// =============================================================================
// Variance Reason Enum
// =============================================================================

export const varianceReasonEnum = z.enum(['damaged', 'short-shipped', 'over-shipped', 'other'])

export type VarianceReason = z.infer<typeof varianceReasonEnum>

// =============================================================================
// ASN Receive Item Schema
// =============================================================================

export const asnReceiveItemSchema = z.object({
  asn_item_id: z.string().uuid('Invalid ASN item ID'),
  received_qty: z.number().positive('Received quantity must be positive'),
  batch_number: z.string().max(100).optional(),
  supplier_batch_number: z.string().max(100).optional(),
  expiry_date: z.string().optional(),
  manufacture_date: z.string().optional(),
  variance_reason: varianceReasonEnum.optional(),
  variance_notes: z.string().max(500).optional(),
})

export type ASNReceiveItemSchema = z.infer<typeof asnReceiveItemSchema>

// =============================================================================
// ASN Receive Request Schema
// =============================================================================

export const asnReceiveRequestSchema = z.object({
  warehouse_id: z.string().uuid('Invalid warehouse ID'),
  location_id: z.string().uuid('Invalid location ID'),
  items: z.array(asnReceiveItemSchema).min(1, 'At least one item required'),
  notes: z.string().max(1000).optional(),
})

export type ASNReceiveRequestSchema = z.infer<typeof asnReceiveRequestSchema>

// Export convenience types
export type ASNReceiveRequest = ASNReceiveRequestSchema
export type ASNReceiveItem = ASNReceiveItemSchema
