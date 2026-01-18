/**
 * Validation Schemas: Expiry Alerts
 * Story: 05.28 - Expiry Alerts Dashboard
 * Extended for: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * Zod schemas for expiry alert API validation
 */

import { z } from 'zod'

// Expiry tier enum
export const expiryTierEnum = z.enum(['expired', 'critical', 'warning', 'ok'])

export type ExpiryTier = z.infer<typeof expiryTierEnum>

// Expiring items query parameters (GET /api/warehouse/inventory/expiring)
export const expiringItemsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  warehouse_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  tier: z.enum(['expired', 'critical', 'warning', 'ok', 'all']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type ExpiringItemsQuery = z.infer<typeof expiringItemsQuerySchema>

// Expiring LP response schema
export const expiringLPSchema = z.object({
  lp_id: z.string().uuid(),
  lp_number: z.string(),
  product_id: z.string().uuid(),
  product_name: z.string(),
  product_sku: z.string().optional(),
  quantity: z.number().positive(),
  uom: z.string(),
  location_id: z.string().uuid(),
  location_code: z.string(),
  warehouse_id: z.string().uuid(),
  warehouse_name: z.string(),
  batch_number: z.string().nullable(),
  expiry_date: z.string(),
  days_until_expiry: z.number().int(),
  tier: expiryTierEnum,
  unit_cost: z.number().nonnegative().optional(),
  value: z.number().nonnegative(),
})

export type ExpiringLP = z.infer<typeof expiringLPSchema>

// Expiry summary response schema
export const expirySummarySchema = z.object({
  expired: z.number().int().nonnegative(),
  critical: z.number().int().nonnegative(),
  warning: z.number().int().nonnegative(),
  ok: z.number().int().nonnegative(),
  total_value: z.number().nonnegative(),
})

export type ExpirySummary = z.infer<typeof expirySummarySchema>

// Paginated expiring items response
export const expiringPaginatedResponseSchema = z.object({
  days_threshold: z.number().int(),
  summary: expirySummarySchema,
  data: z.array(expiringLPSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    pages: z.number().int().nonnegative(),
  }),
})

export type ExpiringPaginatedResponse = z.infer<typeof expiringPaginatedResponseSchema>

// Bulk actions schema
export const bulkExpiryActionSchema = z.object({
  action: z.enum(['quarantine', 'adjust', 'print_labels']),
  lp_ids: z.array(z.string().uuid()).min(1).max(100),
})

export type BulkExpiryAction = z.infer<typeof bulkExpiryActionSchema>
