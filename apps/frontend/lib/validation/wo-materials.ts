/**
 * WO Materials Validation - Story 03.11a
 *
 * Zod schemas for WO materials validation:
 * - woMaterialSchema: Validation for WO material data
 * - productSummarySchema: Product info for joins
 * - woMaterialsListResponseSchema: GET materials response
 * - createSnapshotResponseSchema: POST snapshot response
 *
 * @module lib/validation/wo-materials
 */

import { z } from 'zod'

// ============================================================================
// WO Material Schema
// ============================================================================

/**
 * WO Material schema for display/validation
 */
export const woMaterialSchema = z.object({
  id: z.string().uuid().optional(),
  wo_id: z.string().uuid('Work Order ID is required'),
  organization_id: z.string().uuid().optional(),
  product_id: z.string().uuid('Product ID is required'),
  material_name: z.string().min(1, 'Material name is required').max(255),
  required_qty: z
    .number()
    .nonnegative('Required quantity must be >= 0')
    .refine(
      (val) => {
        const decimals = (val.toString().split('.')[1] || '').length
        return decimals <= 6
      },
      'Maximum 6 decimal places allowed'
    ),
  consumed_qty: z.number().nonnegative().default(0),
  reserved_qty: z.number().nonnegative().default(0),
  uom: z.string().min(1, 'Unit of measure is required'),
  sequence: z.number().int().min(0).default(0),
  consume_whole_lp: z.boolean().default(false),
  is_by_product: z.boolean().default(false),
  yield_percent: z.number().min(0).max(100).nullable().optional(),
  scrap_percent: z.number().min(0).max(100).default(0),
  condition_flags: z.record(z.unknown()).nullable().optional(),
  bom_item_id: z.string().uuid().nullable().optional(),
  bom_version: z.number().int().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  created_at: z.string().datetime().optional(),
})

export type WOMaterialInput = z.infer<typeof woMaterialSchema>

// ============================================================================
// Product Summary Schema (for joins)
// ============================================================================

export const productSummarySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  product_type: z.string(),
})

export type ProductSummary = z.infer<typeof productSummarySchema>

// ============================================================================
// WO Material with Product Schema
// ============================================================================

export const woMaterialWithProductSchema = woMaterialSchema.extend({
  product: productSummarySchema.nullable().optional(),
})

export type WOMaterialWithProduct = z.infer<typeof woMaterialWithProductSchema>

// ============================================================================
// API Response Schemas
// ============================================================================

/**
 * Response schema for GET /work-orders/:id/materials
 */
export const woMaterialsListResponseSchema = z.object({
  materials: z.array(woMaterialWithProductSchema),
  total: z.number().int().nonnegative(),
  bom_version: z.number().int().positive().nullable(),
  snapshot_at: z.string().datetime().nullable(),
})

export type WOMaterialsListResponse = z.infer<typeof woMaterialsListResponseSchema>

/**
 * Response schema for POST /work-orders/:id/snapshot
 */
export const createSnapshotResponseSchema = z.object({
  success: z.boolean(),
  materials_count: z.number().int().nonnegative(),
  message: z.string(),
})

export type CreateSnapshotResponse = z.infer<typeof createSnapshotResponseSchema>

// ============================================================================
// Error Codes
// ============================================================================

export const WO_MATERIAL_ERROR_CODES = {
  NO_BOM_SELECTED: 'NO_BOM_SELECTED',
  WO_NOT_FOUND: 'WO_NOT_FOUND',
  WO_RELEASED: 'WO_RELEASED',
  FORBIDDEN: 'FORBIDDEN',
} as const

export type WOMaterialErrorCode = keyof typeof WO_MATERIAL_ERROR_CODES
