/**
 * Consumption Schema Validation (Story 04.6a)
 *
 * Zod schemas for material consumption requests:
 * - consumeRequestSchema: Request to consume material from LP
 * - consumptionFilterSchema: Filter for consumption history
 * - reversalRequestSchema: Request to reverse consumption
 *
 * @module lib/validation/consumption-schemas
 */

import { z } from 'zod'

/**
 * Schema for consume material request
 * Used in POST /api/production/work-orders/:id/consume
 */
export const consumeRequestSchema = z.object({
  wo_material_id: z.string().uuid('Invalid material ID'),
  lp_id: z.string().uuid('Invalid LP ID'),
  consume_qty: z
    .number()
    .positive('Quantity must be positive')
    .refine((val) => val > 0, 'Quantity must be greater than zero'),
  notes: z.string().optional(),
})

export type ConsumeRequest = z.infer<typeof consumeRequestSchema>

/**
 * Schema for consumption history filter
 * Used in GET /api/production/work-orders/:id/consumptions
 */
export const consumptionFilterSchema = z.object({
  status: z
    .enum(['consumed', 'reversed', 'pending'])
    .optional(),
  page: z
    .number()
    .int()
    .positive('Page must be positive')
    .optional()
    .default(1),
  limit: z
    .number()
    .int()
    .positive('Limit must be positive')
    .optional()
    .default(20),
})

export type ConsumptionFilter = z.infer<typeof consumptionFilterSchema>

/**
 * Schema for reversal request
 * Used in POST /api/production/work-orders/:id/consume/reverse
 */
export const reversalRequestSchema = z.object({
  consumption_id: z.string().uuid('Invalid consumption ID'),
  reason: z
    .string()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason must not exceed 500 characters'),
  notes: z.string().max(1000).optional(),
})

export type ReversalRequest = z.infer<typeof reversalRequestSchema>
