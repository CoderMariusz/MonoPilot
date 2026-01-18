/**
 * Aging Report Schema
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Zod schemas for aging report query validation
 */

import { z } from 'zod'

/**
 * Query schema for aging report endpoint
 * GET /api/warehouse/inventory/aging
 */
export const agingReportQuerySchema = z.object({
  mode: z.enum(['fifo', 'fefo']).default('fifo'),
  warehouse_id: z.string().uuid().optional(),
  product_category_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type AgingReportQuery = z.infer<typeof agingReportQuerySchema>

/**
 * Aging bucket enum
 */
export const agingBucketEnum = z.enum(['0-7', '8-30', '31-90', '90+'])

export type AgingBucket = z.infer<typeof agingBucketEnum>

/**
 * Query schema for top oldest stock endpoint
 * GET /api/warehouse/inventory/aging/top-oldest
 */
export const topOldestQuerySchema = z.object({
  mode: z.enum(['fifo', 'fefo']).default('fifo'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export type TopOldestQuery = z.infer<typeof topOldestQuerySchema>
