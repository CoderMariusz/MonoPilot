/**
 * RMA Validation Schemas
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * Zod schemas for RMA forms and API requests
 */

import { z } from 'zod'

// Enums
export const rmaReasonCodeEnum = z.enum([
  'damaged',
  'expired',
  'wrong_product',
  'quality_issue',
  'customer_change',
  'other',
])

export const rmaDispositionEnum = z.enum([
  'restock',
  'scrap',
  'quality_hold',
  'rework',
])

export const rmaStatusEnum = z.enum([
  'pending',
  'approved',
  'receiving',
  'received',
  'processed',
  'closed',
])

export type RMAReasonCode = z.infer<typeof rmaReasonCodeEnum>
export type RMADisposition = z.infer<typeof rmaDispositionEnum>
export type RMAStatus = z.infer<typeof rmaStatusEnum>

// Display labels for enums
export const RMA_REASON_LABELS: Record<RMAReasonCode, string> = {
  damaged: 'Damaged',
  expired: 'Expired',
  wrong_product: 'Wrong Product',
  quality_issue: 'Quality Issue',
  customer_change: 'Customer Change',
  other: 'Other',
}

export const RMA_DISPOSITION_LABELS: Record<RMADisposition, string> = {
  restock: 'Restock',
  scrap: 'Scrap',
  quality_hold: 'Quality Hold',
  rework: 'Rework',
}

export const RMA_STATUS_LABELS: Record<RMAStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  receiving: 'Receiving',
  received: 'Received',
  processed: 'Processed',
  closed: 'Closed',
}

// Default dispositions based on reason code
export const REASON_TO_DISPOSITION: Partial<Record<RMAReasonCode, RMADisposition>> = {
  damaged: 'scrap',
  expired: 'scrap',
  wrong_product: 'restock',
  quality_issue: 'quality_hold',
  customer_change: 'restock',
}

// RMA Line schema
export const rmaLineSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity_expected: z
    .number()
    .positive('Quantity must be greater than zero')
    .max(999999.9999, 'Quantity too large'),
  lot_number: z
    .string()
    .max(100, 'Lot number must be at most 100 characters')
    .optional()
    .nullable(),
  reason_notes: z
    .string()
    .max(500, 'Reason notes must be at most 500 characters')
    .optional()
    .nullable(),
  disposition: rmaDispositionEnum.optional().nullable(),
})

// RMA create/edit form schema
export const rmaFormSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  sales_order_id: z.string().uuid('Invalid sales order ID').optional().nullable(),
  reason_code: rmaReasonCodeEnum,
  disposition: rmaDispositionEnum.optional().nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be at most 2000 characters')
    .optional()
    .nullable(),
  lines: z
    .array(rmaLineSchema)
    .min(1, 'At least one line item is required'),
})

// RMA update schema (partial)
export const rmaUpdateSchema = rmaFormSchema.partial().omit({ lines: true })

// API schemas
export const rmaListParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  status: rmaStatusEnum.optional(),
  reason_code: rmaReasonCodeEnum.optional(),
  customer_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
})

export const rmaApproveSchema = z.object({
  confirmation: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation is required to approve' }),
  }),
})

export const rmaCloseSchema = z.object({
  confirmation: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation is required to close' }),
  }),
})

// Types inferred from schemas
export type RMALineInput = z.infer<typeof rmaLineSchema>
export type RMAFormInput = z.infer<typeof rmaFormSchema>
export type RMAUpdateInput = z.infer<typeof rmaUpdateSchema>
export type RMAListParams = z.infer<typeof rmaListParamsSchema>
