/**
 * Yield Tracking Validation Schemas
 * Story: 04.4 - Yield Tracking
 *
 * Zod schemas for yield-related API requests and responses:
 * - updateYieldSchema: PATCH request body for updating produced_quantity
 * - yieldLogSchema: Schema for yield_logs table records
 * - yieldResponseSchema: API response structure
 *
 * Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-014)
 */

import { z } from 'zod'

/**
 * Schema for PATCH /api/production/work-orders/:id/yield
 * Updates produced_quantity on a work order
 *
 * Business Rules:
 * - produced_quantity must be non-negative
 * - produced_quantity must be a finite number (no NaN, Infinity)
 * - notes optional, max 1000 characters
 */
export const updateYieldSchema = z.object({
  produced_quantity: z
    .number({
      required_error: 'Produced quantity is required',
      invalid_type_error: 'Must be a valid number',
    })
    .nonnegative({ message: 'Produced quantity must be positive' })
    .finite({ message: 'Must be a valid number' }),
  notes: z.string().max(1000, { message: 'Notes must be at most 1000 characters' }).optional(),
})

/**
 * Input type for yield update API
 */
export type UpdateYieldInput = z.infer<typeof updateYieldSchema>

/**
 * Schema for yield_logs table records
 *
 * Fields:
 * - wo_id: UUID of the work order
 * - old_quantity: Previous produced_quantity value
 * - new_quantity: New produced_quantity value
 * - old_yield_percent: Previous yield percentage
 * - new_yield_percent: New yield percentage
 * - notes: Optional notes for the update
 *
 * Yield percent can exceed 100% (overproduction allowed up to 10000%)
 */
export const yieldLogSchema = z.object({
  wo_id: z.string().uuid({ message: 'Invalid work order ID' }),
  old_quantity: z.number().nonnegative({ message: 'Old quantity must be non-negative' }),
  new_quantity: z.number().nonnegative({ message: 'New quantity must be non-negative' }),
  old_yield_percent: z
    .number()
    .min(0, { message: 'Old yield percent must be non-negative' })
    .max(10000, { message: 'Old yield percent cannot exceed 10000%' }),
  new_yield_percent: z
    .number()
    .min(0, { message: 'New yield percent must be non-negative' })
    .max(10000, { message: 'New yield percent cannot exceed 10000%' }),
  notes: z.string().max(1000, { message: 'Notes must be at most 1000 characters' }).optional(),
})

/**
 * Input type for yield log creation
 */
export type YieldLogInput = z.infer<typeof yieldLogSchema>

/**
 * Yield color enum for visual indicators
 * - green: yield >= 80% (Excellent)
 * - yellow: yield 70-79% (Below Target)
 * - red: yield < 70% (Low Yield)
 */
export const yieldColorEnum = z.enum(['green', 'yellow', 'red'])

/**
 * Schema for yield API response data
 */
export const yieldResponseSchema = z.object({
  wo_id: z.string().uuid({ message: 'Invalid work order ID' }),
  produced_quantity: z.number().nonnegative(),
  yield_percent: z.number().nonnegative(),
  yield_color: yieldColorEnum,
  yield_label: z.string(),
  updated_at: z.string().datetime({ message: 'Invalid datetime format' }),
})

/**
 * Response type for yield update API
 */
export type YieldResponseData = z.infer<typeof yieldResponseSchema>
