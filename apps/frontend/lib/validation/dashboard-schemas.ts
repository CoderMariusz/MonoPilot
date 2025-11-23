// Validation schemas for Dashboard (Stories 2.23, 2.24)
import { z } from 'zod'

// Product Dashboard Query
export const productDashboardQuerySchema = z.object({
  group_by: z.enum(['type']).default('type'),
  include_stats: z.boolean().default(true),
  limit: z.number().int().min(1).max(100).default(8)
})

export type ProductDashboardQuery = z.infer<typeof productDashboardQuerySchema>

// Allergen Matrix Query
export const allergenMatrixQuerySchema = z.object({
  product_types: z.array(z.string()).optional(),
  allergen_ids: z.array(z.string().uuid()).optional(),
  allergen_count_min: z.number().int().min(0).optional(),
  allergen_count_max: z.number().int().max(14).optional(),
  sort_by: z.enum(['code', 'name', 'allergen_count']).default('code'),
  limit: z.number().int().min(1).max(100).default(100),
  offset: z.number().int().min(0).default(0)
})

export type AllergenMatrixQuery = z.infer<typeof allergenMatrixQuerySchema>
