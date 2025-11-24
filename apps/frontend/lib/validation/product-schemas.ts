/**
 * Validation schemas for Products (Epic 2 Batch 2A)
 * Stories: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { z } from 'zod'

// ============================================================================
// Product CRUD Schemas (Story 2.1)
// ============================================================================

const productBaseSchema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be less than 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code must be alphanumeric with hyphens or underscores'),
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters'),
  type: z.enum(['RM', 'WIP', 'FG', 'PKG', 'BP', 'CUSTOM'], {
    errorMap: () => ({ message: 'Invalid product type' })
  }),
  description: z.string().optional(),
  category: z.string().optional(),
  uom: z.string().min(1, 'Unit of Measure is required'),
  shelf_life_days: z.number().int().positive().optional(),
  min_stock_qty: z.number().positive().optional(),
  max_stock_qty: z.number().positive().optional(),
  reorder_point: z.number().positive().optional(),
  cost_per_unit: z.number().positive().optional(),
  status: z.enum(['active', 'inactive', 'obsolete']).optional().default('active')
})

export const productCreateSchema = productBaseSchema.refine(
  (data) => {
    // If max_stock_qty is provided, it must be greater than min_stock_qty
    if (data.max_stock_qty && data.min_stock_qty) {
      return data.max_stock_qty > data.min_stock_qty
    }
    return true
  },
  {
    message: 'Max stock quantity must be greater than min stock quantity',
    path: ['max_stock_qty']
  }
)

export const productUpdateSchema = productBaseSchema.omit({ code: true }).partial()

export type ProductCreateInput = z.input<typeof productCreateSchema>
export type ProductUpdateInput = z.input<typeof productUpdateSchema>

// ============================================================================
// Product Allergen Schema (Story 2.4)
// ============================================================================

export const allergenAssignmentSchema = z.object({
  contains: z.array(z.string().uuid()).optional().default([]),
  may_contain: z.array(z.string().uuid()).optional().default([])
})

export type AllergenAssignmentInput = z.input<typeof allergenAssignmentSchema>

// ============================================================================
// Product Type Schemas (Story 2.5)
// ============================================================================

export const productTypeCreateSchema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code must be less than 10 characters')
    .regex(/^[A-Z]+$/, 'Code must be uppercase letters only')
    .refine(code => !['RM', 'WIP', 'FG', 'PKG', 'BP'].includes(code), {
      message: 'This code is reserved for default types'
    }),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
})

export const productTypeUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  is_active: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
})

export type ProductTypeCreateInput = z.input<typeof productTypeCreateSchema>
export type ProductTypeUpdateInput = z.input<typeof productTypeUpdateSchema>

// ============================================================================
// Technical Settings Schema (Story 2.22)
// ============================================================================

const fieldConfigSchema = z.object({
  visible: z.boolean(),
  mandatory: z.boolean()
}).refine(data => !data.mandatory || data.visible, {
  message: 'Mandatory fields must be visible'
})

export const technicalSettingsSchema = z.object({
  product_field_config: z.record(fieldConfigSchema),
  max_bom_versions: z.number().int().positive().nullable(),
  use_conditional_flags: z.boolean(),
  conditional_flags: z.array(
    z.string().regex(/^[a-z_]+$/, 'Flag must be lowercase with underscores')
  )
})

export type TechnicalSettingsInput = z.input<typeof technicalSettingsSchema>

// ============================================================================
// Query Parameter Schemas
// ============================================================================

export const productListQuerySchema = z.object({
  search: z.string().optional(),
  type: z.array(z.string()).or(z.string()).optional(),
  status: z.array(z.string()).or(z.string()).optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  sort: z.string().optional().default('code'),
  order: z.enum(['asc', 'desc']).optional().default('asc')
})

export type ProductListQuery = z.infer<typeof productListQuerySchema>

export const versionCompareQuerySchema = z.object({
  v1: z.coerce.number(),
  v2: z.coerce.number()
})

export type VersionCompareQuery = z.infer<typeof versionCompareQuerySchema>
