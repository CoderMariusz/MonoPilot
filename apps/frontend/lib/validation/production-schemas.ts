import { z } from 'zod'

/**
 * Production Settings Schema (Story 4.17)
 * Validates production module configuration
 */
export const productionSettingsSchema = z.object({
  allow_pause_wo: z.boolean(),
  auto_complete_wo: z.boolean(),
  require_operation_sequence: z.boolean(),
  require_qa_on_output: z.boolean(),
  auto_create_by_product_lp: z.boolean(),
  dashboard_refresh_seconds: z
    .number()
    .int()
    .min(30, 'Minimum 30 seconds to prevent server overload')
    .max(300, 'Maximum 300 seconds'),
  // Story 4.11: Over-Consumption Control
  allow_over_consumption: z.boolean().optional(),
})

export type ProductionSettingsInput = z.infer<typeof productionSettingsSchema>

/**
 * Story 04.2b: WO Pause/Resume Schemas
 * Validates pause/resume request bodies
 */

// Pause reason enum
export const pauseReasonEnum = z.enum([
  'machine_breakdown',
  'material_shortage',
  'break',
  'quality_issue',
  'other',
])

export type PauseReason = z.infer<typeof pauseReasonEnum>

// Pause work order request schema
export const pauseWorkOrderSchema = z.object({
  reason: pauseReasonEnum,
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
})

export type PauseWorkOrderInput = z.infer<typeof pauseWorkOrderSchema>

// Resume work order request schema (no body required, but allow empty object)
export const resumeWorkOrderSchema = z.object({}).optional()

export type ResumeWorkOrderInput = z.infer<typeof resumeWorkOrderSchema>

/**
 * Work Order Status Type
 * Shared across Pause/Resume and Yield components
 */
export const woStatusEnum = z.enum([
  'draft',
  'released',
  'in_progress',
  'paused',
  'completed',
  'cancelled',
])

export type WOStatus = z.infer<typeof woStatusEnum>

/**
 * Story 04.6d: Consumption Reversal Schemas
 * Validates reversal request bodies for material consumption correction
 */

// Reversal reason enum (per 04.6d spec)
export const reversalReasonEnum = z.enum([
  'scanned_wrong_lp',
  'wrong_quantity',
  'operator_error',
  'quality_issue',
  'other',
])

export type ReversalReason = z.infer<typeof reversalReasonEnum>

// Labels for reversal reasons (for UI display)
export const reversalReasonLabels = {
  scanned_wrong_lp: 'Scanned Wrong LP',
  wrong_quantity: 'Wrong Quantity Entered',
  operator_error: 'Operator Error',
  quality_issue: 'Quality Issue',
  other: 'Other (specify)',
} as const

// Reverse consumption request schema
export const reverseConsumptionSchema = z
  .object({
    consumption_id: z.string().uuid('Invalid consumption ID'),
    reason: reversalReasonEnum,
    notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  })
  .refine(
    (data) => data.reason !== 'other' || (data.notes && data.notes.trim().length > 0),
    {
      message: 'Notes are required when reason is "other"',
      path: ['notes'],
    }
  )

export type ReverseConsumptionInput = z.infer<typeof reverseConsumptionSchema>

/**
 * Story 04.6e: Over-Consumption Control Schemas
 * Validates over-consumption request, approval, and rejection
 */

// Over-consumption request schema
export const overConsumptionRequestSchema = z.object({
  wo_material_id: z.string().uuid('Invalid material ID'),
  lp_id: z.string().uuid('Invalid LP ID'),
  requested_qty: z.number().positive('Quantity must be positive'),
})

export type OverConsumptionRequestInput = z.infer<typeof overConsumptionRequestSchema>

// Over-consumption approval schema
export const overConsumptionApprovalSchema = z.object({
  request_id: z.string().uuid('Invalid request ID'),
  reason: z.string().max(500).optional(),
})

export type OverConsumptionApprovalInput = z.infer<typeof overConsumptionApprovalSchema>

// Over-consumption rejection schema
export const overConsumptionRejectionSchema = z.object({
  request_id: z.string().uuid('Invalid request ID'),
  reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(500)
    .refine((val) => val.trim().length > 0, 'Rejection reason is required'),
})

export type OverConsumptionRejectionInput = z.infer<typeof overConsumptionRejectionSchema>

/**
 * Story 04.7d: Multiple Outputs per WO - Output Query Schema
 * Validates pagination and filtering parameters for output list API
 */

// Output query parameters
export const outputQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1).max(100, 'Limit cannot exceed 100').default(20),
  qa_status: z.enum(['approved', 'pending', 'rejected']).optional(),
  location_id: z.string().uuid('Invalid location ID').optional(),
  sort: z.enum(['created_at', 'qty', 'lp_number']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type OutputQueryInput = z.infer<typeof outputQuerySchema>
