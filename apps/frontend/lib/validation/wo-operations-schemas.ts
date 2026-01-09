/**
 * WO Operations Validation Schemas (Story 03.12)
 * Zod schemas for Work Order Operations - routing copy and status management
 *
 * Covers:
 * - copyRoutingSchema: Manual routing copy trigger (admin)
 * - updateWOOperationSchema: Update operation (Epic 04)
 * - startOperationSchema: Start operation (Epic 04)
 * - completeOperationSchema: Complete operation (Epic 04)
 * - skipOperationSchema: Skip operation (Epic 04)
 *
 * Security: All schemas validate input before database operations.
 * Multi-tenancy: org_id isolation enforced at service/RLS level, not schema.
 */

import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Valid operation statuses
 * - pending: Initial state when copied from routing
 * - in_progress: Operator has started the operation
 * - completed: Operator has finished the operation
 * - skipped: Operator marked as skipped (requires reason)
 */
export const woOperationStatusEnum = z.enum([
  'pending',
  'in_progress',
  'completed',
  'skipped',
])

export type WOOperationStatus = z.infer<typeof woOperationStatusEnum>

// ============================================================================
// UUID VALIDATION HELPER
// ============================================================================

/**
 * UUID validation with consistent error messages
 */
const uuidSchema = (fieldName: string) =>
  z.string().uuid(`Invalid ${fieldName} ID format`)

// ============================================================================
// COPY ROUTING SCHEMA (Admin action)
// ============================================================================

/**
 * Schema for manual routing copy trigger
 * POST /api/planning/work-orders/:id/copy-routing
 *
 * Admin-only action to manually copy routing operations to WO.
 * Normally this happens automatically on WO release.
 */
export const copyRoutingSchema = z.object({
  /**
   * Work Order ID to copy routing to
   * Must be valid UUID
   */
  wo_id: uuidSchema('Work Order'),
})

export type CopyRoutingInput = z.infer<typeof copyRoutingSchema>

// ============================================================================
// UPDATE OPERATION SCHEMA (Epic 04 - Production)
// ============================================================================

/**
 * Schema for updating WO operation
 * PUT /api/planning/work-orders/:id/operations/:op_id
 *
 * Used by production operators to update operation details.
 */
export const updateWOOperationSchema = z.object({
  /**
   * Operation status transition
   * Validated separately for transition rules
   */
  status: woOperationStatusEnum.optional(),

  /**
   * Actual duration in minutes
   * Must be non-negative integer
   */
  actual_duration_minutes: z
    .number()
    .int('Duration must be a whole number')
    .nonnegative('Duration cannot be negative')
    .optional()
    .nullable(),

  /**
   * Actual yield percentage (0-100)
   * Decimal value for precision
   */
  actual_yield_percent: z
    .number()
    .min(0, 'Yield cannot be negative')
    .max(100, 'Yield cannot exceed 100%')
    .optional()
    .nullable(),

  /**
   * Reason for skipping (required when status = 'skipped')
   */
  skip_reason: z
    .string()
    .max(500, 'Skip reason cannot exceed 500 characters')
    .optional()
    .nullable(),

  /**
   * Operator notes
   */
  notes: z
    .string()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .nullable(),
})

export type UpdateWOOperationInput = z.infer<typeof updateWOOperationSchema>

// ============================================================================
// START OPERATION SCHEMA (Epic 04 - Production)
// ============================================================================

/**
 * Schema for starting an operation
 * POST /api/planning/work-orders/:id/operations/:op_id/start
 *
 * Transitions operation from 'pending' to 'in_progress'.
 */
export const startOperationSchema = z.object({
  /**
   * Override start timestamp (defaults to NOW if not provided)
   * ISO 8601 datetime format
   */
  started_at: z
    .string()
    .datetime({ message: 'Invalid timestamp format. Use ISO 8601.' })
    .optional(),
})

export type StartOperationInput = z.infer<typeof startOperationSchema>

// ============================================================================
// COMPLETE OPERATION SCHEMA (Epic 04 - Production)
// ============================================================================

/**
 * Schema for completing an operation
 * POST /api/planning/work-orders/:id/operations/:op_id/complete
 *
 * Transitions operation from 'in_progress' to 'completed'.
 */
export const completeOperationSchema = z.object({
  /**
   * Override completion timestamp (defaults to NOW if not provided)
   * ISO 8601 datetime format
   */
  completed_at: z
    .string()
    .datetime({ message: 'Invalid timestamp format. Use ISO 8601.' })
    .optional(),

  /**
   * Actual yield percentage achieved
   */
  actual_yield_percent: z
    .number()
    .min(0, 'Yield cannot be negative')
    .max(100, 'Yield cannot exceed 100%')
    .optional()
    .nullable(),

  /**
   * Completion notes
   */
  notes: z
    .string()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .nullable(),
})

export type CompleteOperationInput = z.infer<typeof completeOperationSchema>

// ============================================================================
// SKIP OPERATION SCHEMA (Epic 04 - Production)
// ============================================================================

/**
 * Schema for skipping an operation
 * POST /api/planning/work-orders/:id/operations/:op_id/skip
 *
 * Transitions operation to 'skipped' status.
 * Requires mandatory skip reason for traceability.
 */
export const skipOperationSchema = z.object({
  /**
   * Reason for skipping the operation (required)
   * Must be provided for audit trail
   */
  skip_reason: z
    .string()
    .min(1, 'Skip reason is required')
    .max(500, 'Skip reason cannot exceed 500 characters'),
})

export type SkipOperationInput = z.infer<typeof skipOperationSchema>

// ============================================================================
// QUERY PARAMS SCHEMAS
// ============================================================================

/**
 * Schema for operation list query parameters
 * GET /api/planning/work-orders/:id/operations
 */
export const operationsQuerySchema = z.object({
  /**
   * Filter by status
   */
  status: woOperationStatusEnum.optional(),

  /**
   * Include completed operations
   */
  include_completed: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),

  /**
   * Include skipped operations
   */
  include_skipped: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
})

export type OperationsQueryParams = z.infer<typeof operationsQuerySchema>

// ============================================================================
// RESPONSE TYPE SCHEMAS (for type safety)
// ============================================================================

/**
 * Operation response schema (list item)
 */
export const woOperationResponseSchema = z.object({
  id: z.string().uuid(),
  wo_id: z.string().uuid(),
  sequence: z.number().int(),
  operation_name: z.string(),
  description: z.string().nullable(),
  machine_id: z.string().uuid().nullable(),
  machine_code: z.string().nullable(),
  machine_name: z.string().nullable(),
  line_id: z.string().uuid().nullable(),
  line_code: z.string().nullable(),
  line_name: z.string().nullable(),
  expected_duration_minutes: z.number().nullable(),
  expected_yield_percent: z.number().nullable(),
  actual_duration_minutes: z.number().nullable(),
  actual_yield_percent: z.number().nullable(),
  status: woOperationStatusEnum,
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  started_by: z.string().uuid().nullable(),
  completed_by: z.string().uuid().nullable(),
  started_by_user: z.object({ name: z.string() }).nullable(),
  completed_by_user: z.object({ name: z.string() }).nullable(),
  skip_reason: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
})

export type WOOperationResponse = z.infer<typeof woOperationResponseSchema>

/**
 * Operation detail response schema (includes instructions and variances)
 */
export const woOperationDetailResponseSchema = woOperationResponseSchema.extend({
  instructions: z.string().nullable(),
  machine: z
    .object({
      id: z.string().uuid(),
      code: z.string(),
      name: z.string(),
    })
    .nullable(),
  line: z
    .object({
      id: z.string().uuid(),
      code: z.string(),
      name: z.string(),
    })
    .nullable(),
  duration_variance_minutes: z.number().nullable(),
  yield_variance_percent: z.number().nullable(),
  started_by_user: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable(),
  completed_by_user: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable(),
  updated_at: z.string(),
})

export type WOOperationDetailResponse = z.infer<typeof woOperationDetailResponseSchema>

/**
 * Copy routing response schema
 */
export const copyRoutingResponseSchema = z.object({
  success: z.boolean(),
  operations_created: z.number().int().nonnegative(),
  message: z.string(),
})

export type CopyRoutingResponse = z.infer<typeof copyRoutingResponseSchema>
