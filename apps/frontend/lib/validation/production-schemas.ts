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
