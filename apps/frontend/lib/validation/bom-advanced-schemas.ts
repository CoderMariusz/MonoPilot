/**
 * BOM Advanced Features Validation Schemas
 * Story: 02.14 - BOM Advanced Features: Version Comparison, Yield & Scaling
 *
 * Zod schemas for:
 * - Scale BOM request validation
 * - Update yield request validation
 * - Explosion query parameters
 * - Response type schemas
 */

import { z } from 'zod'

// =============================================================================
// Scale BOM Request Schema (FR-2.35)
// =============================================================================

export const scaleBomRequestSchema = z.object({
  target_batch_size: z.number().positive('Batch size must be positive').optional(),
  target_uom: z.string().optional(),
  scale_factor: z.number().positive('Scale factor must be positive').optional(),
  preview_only: z.boolean().default(true),
  round_decimals: z.number().int().min(0).max(6).default(3),
}).refine(
  (data) => data.target_batch_size !== undefined || data.scale_factor !== undefined,
  { message: 'Either target_batch_size or scale_factor required', path: ['target_batch_size'] }
)

export type ScaleBomRequest = z.infer<typeof scaleBomRequestSchema>

// =============================================================================
// Update Yield Request Schema (FR-2.34)
// =============================================================================

export const updateYieldRequestSchema = z.object({
  expected_yield_percent: z.number().min(0, 'Yield percent must be at least 0').max(100, 'Yield percent cannot exceed 100'),
  variance_threshold_percent: z.number().min(0).max(100).default(5),
})

export type UpdateYieldRequest = z.infer<typeof updateYieldRequestSchema>

// =============================================================================
// Explosion Query Parameters Schema (FR-2.29)
// =============================================================================

export const explosionQuerySchema = z.object({
  maxDepth: z.coerce.number().int().min(1).max(10).default(10),
  includeQuantities: z.coerce.boolean().default(true),
})

export type ExplosionQuery = z.infer<typeof explosionQuerySchema>

// =============================================================================
// BOM Item Summary Schema (for comparison)
// =============================================================================

export const bomItemSummarySchema = z.object({
  id: z.string().uuid(),
  component_id: z.string().uuid(),
  component_code: z.string(),
  component_name: z.string(),
  quantity: z.number(),
  uom: z.string(),
  sequence: z.number(),
  operation_seq: z.number().nullable(),
  scrap_percent: z.number(),
  is_output: z.boolean(),
})

export type BomItemSummary = z.infer<typeof bomItemSummarySchema>

// =============================================================================
// Modified Item Schema (for comparison diffs)
// =============================================================================

export const modifiedItemSchema = z.object({
  item_id: z.string().uuid(),
  component_id: z.string().uuid(),
  component_code: z.string(),
  component_name: z.string(),
  field: z.enum(['quantity', 'uom', 'scrap_percent', 'sequence', 'operation_seq']),
  old_value: z.union([z.string(), z.number()]),
  new_value: z.union([z.string(), z.number()]),
  change_percent: z.number().nullable(),
})

export type ModifiedItem = z.infer<typeof modifiedItemSchema>

// =============================================================================
// Loss Factor Schema (for yield calculation)
// =============================================================================

export const lossFactorSchema = z.object({
  type: z.enum(['moisture', 'trim', 'process', 'custom']),
  description: z.string(),
  loss_percent: z.number().min(0).max(100),
})

export type LossFactor = z.infer<typeof lossFactorSchema>
