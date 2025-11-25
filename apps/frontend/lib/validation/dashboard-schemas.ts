// Validation schemas for Dashboard (Stories 2.23, 2.24)
import { z } from 'zod'

// Product Dashboard Query (AC-2.23.1 - AC-2.23.10)
export const productDashboardQuerySchema = z.object({
  group_by: z.enum(['type']).default('type'),
  include_stats: z.boolean().default(true),
  limit: z.number().int().min(1).max(100).default(8),
  search: z.string().optional(),
  type_filter: z.enum(['all', 'RM', 'WIP', 'FG']).default('all')
})

export type ProductDashboardQuery = z.infer<typeof productDashboardQuerySchema>

// Recent Activity Query (AC-2.23.6)
export const recentActivityQuerySchema = z.object({
  days: z.number().int().min(1).max(90).default(7),
  limit: z.number().int().min(1).max(50).default(10)
})

export type RecentActivityQuery = z.infer<typeof recentActivityQuerySchema>

// Allergen Matrix Query (AC-2.24.4 - AC-2.24.6)
export const allergenMatrixQuerySchema = z.object({
  product_types: z.array(z.enum(['RM', 'WIP', 'FG'])).optional(),
  allergen_ids: z.array(z.string().uuid()).optional(),
  allergen_count_min: z.number().int().min(0).optional(),
  allergen_count_max: z.number().int().max(20).optional(),
  has_allergens: z.enum(['all', 'with', 'without', 'missing']).default('all'),
  sort_by: z.enum(['code', 'name', 'allergen_count', 'type']).default('code'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(200).default(50)
})

export type AllergenMatrixQuery = z.infer<typeof allergenMatrixQuerySchema>

// Allergen Edit (AC-2.24.8)
export const allergenEditSchema = z.object({
  product_id: z.string().uuid(),
  allergen_id: z.string().uuid(),
  status: z.enum(['contains', 'may_contain', 'none'])
})

export type AllergenEdit = z.infer<typeof allergenEditSchema>

// Export Request (AC-2.24.7)
export const exportRequestSchema = z.object({
  filters: z.object({
    product_types: z.array(z.enum(['RM', 'WIP', 'FG'])).optional(),
    allergen_ids: z.array(z.string().uuid()).optional(),
    allergen_count_min: z.number().int().min(0).optional(),
    allergen_count_max: z.number().int().max(20).optional(),
    search: z.string().optional()
  }).optional(),
  format: z.enum(['excel', 'csv', 'pdf'])
})

export type ExportRequest = z.infer<typeof exportRequestSchema>
