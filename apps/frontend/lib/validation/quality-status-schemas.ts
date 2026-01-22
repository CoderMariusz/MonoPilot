/**
 * Quality Status Validation Schemas (Story 06.1)
 * Purpose: Zod validation schemas for quality status operations
 *
 * Provides schemas for:
 * - qualityStatusEnum: 7 QA status types
 * - entityTypeEnum: Entity types (lp, batch, inspection)
 * - validateTransitionSchema: Validate status transition request
 * - changeStatusSchema: Change status request
 * - statusHistoryQuerySchema: Query status history
 * - currentStatusQuerySchema: Query valid transitions for current status
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
 */

import { z } from 'zod'

// ============================================================================
// Quality Status Enum
// ============================================================================

/**
 * Valid quality status values (7 statuses per PRD)
 * - PENDING: Awaiting inspection
 * - PASSED: Meets specifications
 * - FAILED: Does not meet specs
 * - HOLD: Investigation required
 * - RELEASED: Approved for use after hold
 * - QUARANTINED: Isolated pending review
 * - COND_APPROVED: Conditionally approved (limited use)
 */
export const QUALITY_STATUSES = [
  'PENDING',
  'PASSED',
  'FAILED',
  'HOLD',
  'RELEASED',
  'QUARANTINED',
  'COND_APPROVED',
] as const

export type QualityStatus = (typeof QUALITY_STATUSES)[number]

export const qualityStatusEnum = z.enum(QUALITY_STATUSES, {
  errorMap: () => ({
    message: `Status must be one of: ${QUALITY_STATUSES.join(', ')}`,
  }),
})

// ============================================================================
// Entity Type Enum
// ============================================================================

/**
 * Valid entity types for status tracking
 * - lp: License Plate
 * - batch: Production Batch
 * - inspection: Quality Inspection
 */
export const ENTITY_TYPES = ['lp', 'batch', 'inspection'] as const

export type EntityType = (typeof ENTITY_TYPES)[number]

export const entityTypeEnum = z.enum(ENTITY_TYPES, {
  errorMap: () => ({
    message: `Entity type must be one of: ${ENTITY_TYPES.join(', ')}`,
  }),
})

// ============================================================================
// Validate Transition Schema
// ============================================================================

/**
 * Schema for validating a status transition request
 *
 * Fields:
 * - entity_type: Required - One of: lp, batch, inspection
 * - entity_id: Required - Valid UUID of the entity
 * - from_status: Required - Current status (one of 7 statuses)
 * - to_status: Required - Target status (one of 7 statuses)
 * - reason: Optional - Explanation for transition (10-500 chars)
 *
 * Validation Rules:
 * - from_status and to_status cannot be the same
 * - reason min length: 10 characters (if provided)
 * - reason max length: 500 characters
 */
export const validateTransitionSchema = z
  .object({
    entity_type: entityTypeEnum,
    entity_id: z.string().uuid('Invalid UUID for entity ID'),
    from_status: qualityStatusEnum,
    to_status: qualityStatusEnum,
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .max(500, 'Reason must be at most 500 characters')
      .optional(),
  })
  .refine((data) => data.from_status !== data.to_status, {
    message: 'From and to status cannot be the same',
    path: ['to_status'],
  })

export type ValidateTransitionInput = z.infer<typeof validateTransitionSchema>

// ============================================================================
// Change Status Schema
// ============================================================================

/**
 * Schema for changing entity status
 *
 * Fields:
 * - entity_type: Required - One of: lp, batch, inspection
 * - entity_id: Required - Valid UUID of the entity
 * - to_status: Required - Target status (one of 7 statuses)
 * - reason: Required - Explanation for change (10-500 chars)
 * - inspection_id: Optional - UUID of associated inspection
 *
 * Validation Rules:
 * - reason is REQUIRED (min 10 chars, max 500 chars)
 * - inspection_id must be valid UUID if provided
 */
export const changeStatusSchema = z.object({
  entity_type: entityTypeEnum,
  entity_id: z.string().uuid('Invalid UUID for entity ID'),
  to_status: qualityStatusEnum,
  reason: z
    .string({ required_error: 'Reason is required for status changes' })
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be at most 500 characters'),
  inspection_id: z.string().uuid('Invalid UUID for inspection ID').optional(),
})

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>

// ============================================================================
// Status History Query Schema
// ============================================================================

/**
 * Schema for querying status history
 *
 * Fields:
 * - entity_type: Required - One of: lp, batch, inspection
 * - entity_id: Required - Valid UUID of the entity
 * - limit: Optional - Number of entries to return (default: 100)
 * - offset: Optional - Number of entries to skip (default: 0)
 *
 * Validation Rules:
 * - limit must be positive if provided
 * - offset must be non-negative if provided
 */
export const statusHistoryQuerySchema = z.object({
  entity_type: entityTypeEnum,
  entity_id: z.string().uuid('Invalid UUID for entity ID'),
  limit: z.number().int().positive('Limit must be positive').optional(),
  offset: z.number().int().nonnegative('Offset must be non-negative').optional(),
})

export type StatusHistoryQueryInput = z.infer<typeof statusHistoryQuerySchema>

// ============================================================================
// Current Status Query Schema
// ============================================================================

/**
 * Schema for querying valid transitions from current status
 *
 * Fields:
 * - current: Required - Current status (one of 7 statuses)
 *
 * Used by: GET /api/quality/status/transitions?current=PENDING
 */
export const currentStatusQuerySchema = z.object({
  current: qualityStatusEnum,
})

export type CurrentStatusQueryInput = z.infer<typeof currentStatusQuerySchema>
