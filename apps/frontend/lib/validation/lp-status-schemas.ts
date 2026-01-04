/**
 * LP Status Management Validation Schemas (Story 05.4)
 * Purpose: Zod validation schemas for LP status management operations
 *
 * Provides schemas for:
 * - updateLPStatusSchema: Update LP status (available/reserved/consumed/blocked)
 * - updateQAStatusSchemaWithReason: Update QA status (pending/passed/failed/quarantine)
 * - blockLPSchema: Block LP with mandatory reason
 * - unblockLPSchema: Unblock LP with optional reason
 * - validateConsumptionSchema: Validate LP can be consumed
 * - lpStatusEnum: LP status enum values
 * - qaStatusEnum: QA status enum values
 */

import { z } from 'zod'

// ============================================================================
// LP Status Enum
// ============================================================================

/**
 * Valid LP status values
 * - available: Ready for use in production
 * - reserved: Allocated to work order or transfer
 * - consumed: Fully consumed in production (terminal status)
 * - blocked: Cannot be used (quality hold, damage, etc)
 */
export const LP_STATUSES = ['available', 'reserved', 'consumed', 'blocked'] as const

export type LPStatus = (typeof LP_STATUSES)[number]

export const lpStatusEnum = z.enum(LP_STATUSES, {
  errorMap: () => ({
    message: `Status must be one of: ${LP_STATUSES.join(', ')}`,
  }),
})

// ============================================================================
// QA Status Enum
// ============================================================================

/**
 * Valid QA status values
 * - pending: Awaiting QA inspection
 * - passed: QA inspection passed
 * - failed: QA inspection failed
 * - quarantine: In quarantine location
 */
export const QA_STATUSES = ['pending', 'passed', 'failed', 'quarantine'] as const

export type QAStatus = (typeof QA_STATUSES)[number]

export const qaStatusEnum = z.enum(QA_STATUSES, {
  errorMap: () => ({
    message: `QA status must be one of: ${QA_STATUSES.join(', ')}`,
  }),
})

// ============================================================================
// Update LP Status Schema
// ============================================================================

/**
 * Schema for updating LP status
 *
 * Fields:
 * - status: Required - One of: available, reserved, consumed, blocked
 * - reason: Optional - Max 500 chars - Explanation for status change
 *
 * Validation Rules:
 * - status field is required
 * - reason is optional but recommended for consumed/blocked
 * - reason max length: 500 characters
 */
export const updateLPStatusSchema = z.object({
  status: lpStatusEnum,
  reason: z
    .string()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional(),
})

export type UpdateLPStatusInput = z.infer<typeof updateLPStatusSchema>

// ============================================================================
// Update QA Status Schema (with conditional reason validation)
// ============================================================================

/**
 * Schema for updating QA status with conditional reason requirement
 *
 * Fields:
 * - qa_status: Required - One of: pending, passed, failed, quarantine
 * - reason: Conditional - Required for failed/quarantine, optional for passed/pending
 *
 * Validation Rules:
 * - qa_status field is required
 * - reason is REQUIRED for failed or quarantine (min 5 chars)
 * - reason is optional for passed or pending
 * - reason max length: 500 characters
 */
export const updateQAStatusSchemaWithReason = z
  .object({
    qa_status: qaStatusEnum,
    reason: z
      .string()
      .min(5, 'Reason must be at least 5 characters')
      .max(500, 'Reason cannot exceed 500 characters')
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Require reason for failed or quarantine
    if ((data.qa_status === 'failed' || data.qa_status === 'quarantine') && !data.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Reason is required for failed or quarantine status',
        path: ['reason'],
      })
    }
  })

export type UpdateQAStatusInput = z.infer<typeof updateQAStatusSchemaWithReason>

// ============================================================================
// Block LP Schema
// ============================================================================

/**
 * Schema for blocking an LP
 *
 * Fields:
 * - reason: Required - Min 10 chars, Max 500 chars - Mandatory explanation
 *
 * Validation Rules:
 * - reason field is REQUIRED
 * - reason min length: 10 characters (descriptive reason required)
 * - reason max length: 500 characters
 */
export const blockLPSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
})

export type BlockLPInput = z.infer<typeof blockLPSchema>

// ============================================================================
// Unblock LP Schema
// ============================================================================

/**
 * Schema for unblocking an LP
 *
 * Fields:
 * - reason: Optional - Max 500 chars - Optional explanation
 *
 * Validation Rules:
 * - reason is optional
 * - reason max length: 500 characters
 */
export const unblockLPSchema = z.object({
  reason: z
    .string()
    .max(500, 'Reason cannot exceed 500 characters')
    .nullable()
    .optional(),
})

export type UnblockLPInput = z.infer<typeof unblockLPSchema>

// ============================================================================
// Validate Consumption Schema
// ============================================================================

/**
 * Schema for validating LP can be consumed
 *
 * Fields:
 * - lp_id: Required - UUID - License plate ID to validate
 *
 * Validation Rules:
 * - lp_id must be valid UUID
 */
export const validateConsumptionSchema = z.object({
  lp_id: z.string().uuid('Invalid UUID format'),
})

export type ValidateConsumptionInput = z.infer<typeof validateConsumptionSchema>

// ============================================================================
// Type Exports
// ============================================================================

export type { LPStatus, QAStatus }
