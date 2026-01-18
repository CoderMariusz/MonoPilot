/**
 * Stock Adjustment Validation Schemas
 * Story: WH-INV-001 - Stock Adjustment History & Approval Workflow
 * Phase: GREEN - Minimal validation to pass tests
 *
 * SECURITY:
 * - Input validation via Zod prevents malformed data
 * - All schemas enforce strict types and constraints
 * - SQL injection prevented by Supabase parameterized queries
 */

import { z } from 'zod'

// =============================================================================
// Enums
// =============================================================================

export const reasonCodeEnum = z.enum([
  'damage',
  'theft',
  'counting_error',
  'quality_issue',
  'expired',
  'other',
])

export const adjustmentStatusEnum = z.enum(['pending', 'approved', 'rejected', 'all'])

export type ReasonCode = z.infer<typeof reasonCodeEnum>
export type AdjustmentStatus = z.infer<typeof adjustmentStatusEnum>

// =============================================================================
// Create Adjustment Schema
// =============================================================================

export const createAdjustmentSchema = z.object({
  lp_id: z.string().uuid('Invalid LP ID'),
  new_qty: z.number().nonnegative('Quantity cannot be negative'),
  reason_code: reasonCodeEnum,
  reason_notes: z.string().max(500, 'Reason notes must be less than 500 characters').optional(),
})

export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>

// =============================================================================
// Reject Adjustment Schema
// =============================================================================

export const rejectAdjustmentSchema = z.object({
  rejection_reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters'),
})

export type RejectAdjustmentInput = z.infer<typeof rejectAdjustmentSchema>

// =============================================================================
// List Adjustments Filters Schema
// =============================================================================

export const adjustmentListFiltersSchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  reason: reasonCodeEnum.optional(),
  adjusted_by: z.string().uuid().optional(),
  status: adjustmentStatusEnum.default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type AdjustmentListFilters = z.infer<typeof adjustmentListFiltersSchema>
