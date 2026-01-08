/**
 * Operation Execution Validation Schemas (Story 04.3)
 * Zod schemas for operation start/complete requests
 */

import { z } from 'zod'

/**
 * Schema for starting an operation
 * started_at is optional - defaults to current time
 */
export const startOperationSchema = z.object({
  started_at: z.string().datetime().optional(),
})

export type StartOperationInput = z.infer<typeof startOperationSchema>

/**
 * Schema for completing an operation
 * actual_yield_percent is required (0-100)
 * actual_duration_minutes is optional (auto-calculated if not provided)
 * notes is optional (max 2000 chars)
 */
export const completeOperationSchema = z.object({
  actual_yield_percent: z
    .number()
    .min(0, 'Yield must be between 0 and 100')
    .max(100, 'Yield must be between 0 and 100'),
  actual_duration_minutes: z.number().positive().optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
})

export type CompleteOperationInput = z.infer<typeof completeOperationSchema>

/**
 * Schema for validating yield only (partial validation)
 */
export const yieldSchema = z
  .number()
  .min(0, 'Yield must be between 0 and 100')
  .max(100, 'Yield must be between 0 and 100')

/**
 * Schema for operation logs query params
 */
export const operationLogsQuerySchema = z.object({
  event_type: z.enum(['started', 'completed', 'skipped', 'reset']).optional(),
})

export type OperationLogsQuery = z.infer<typeof operationLogsQuerySchema>
