/**
 * Costing Validation Schemas - Story 02.9
 *
 * Zod schemas for cost calculation API request validation
 */

import { z } from 'zod'

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * BOM Cost Request - validates BOM ID parameter
 */
export const bomCostRequestSchema = z.object({
  bom_id: z.string().uuid('Invalid BOM ID'),
})

export type BOMCostRequest = z.infer<typeof bomCostRequestSchema>

/**
 * Routing Cost Query - validates query parameters
 */
export const routingCostQuerySchema = z.object({
  batch_size: z.coerce.number().positive('Batch size must be positive').default(1),
})

export type RoutingCostQuery = z.infer<typeof routingCostQuerySchema>

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Material Cost Line Schema
 */
export const materialCostBreakdownSchema = z.object({
  ingredient_id: z.string().uuid(),
  ingredient_code: z.string(),
  ingredient_name: z.string(),
  quantity: z.number().min(0),
  uom: z.string(),
  unit_cost: z.number().min(0),
  scrap_percent: z.number().min(0),
  scrap_cost: z.number().min(0),
  total_cost: z.number().min(0),
  percentage: z.number().min(0).max(100),
})

/**
 * Operation Cost Line Schema
 */
export const operationCostBreakdownSchema = z.object({
  operation_seq: z.number().int().positive(),
  operation_name: z.string(),
  machine_name: z.string().nullable(),
  setup_time_min: z.number().min(0),
  duration_min: z.number().min(0),
  cleanup_time_min: z.number().min(0),
  labor_rate: z.number().min(0),
  setup_cost: z.number().min(0),
  run_cost: z.number().min(0),
  cleanup_cost: z.number().min(0),
  total_cost: z.number().min(0),
  percentage: z.number().min(0).max(100),
})

/**
 * Routing Cost Breakdown Schema
 */
export const routingCostBreakdownSchema = z.object({
  routing_id: z.string().uuid(),
  routing_code: z.string(),
  setup_cost: z.number().min(0),
  working_cost_per_unit: z.number().min(0),
  total_working_cost: z.number().min(0),
  total_routing_cost: z.number().min(0),
})

/**
 * Overhead Breakdown Schema
 */
export const overheadBreakdownSchema = z.object({
  allocation_method: z.enum(['labor_hours', 'percentage']),
  overhead_percent: z.number().min(0).max(100),
  subtotal_before_overhead: z.number().min(0),
  overhead_cost: z.number().min(0),
})

/**
 * BOM Cost Response Schema
 */
export const bomCostResponseSchema = z.object({
  bom_id: z.string().uuid(),
  product_id: z.string().uuid(),
  cost_type: z.literal('standard'),
  batch_size: z.number().positive(),
  batch_uom: z.string(),
  material_cost: z.number().min(0),
  labor_cost: z.number().min(0),
  overhead_cost: z.number().min(0),
  total_cost: z.number().min(0),
  cost_per_unit: z.number().min(0),
  currency: z.string(),
  calculated_at: z.string().datetime(),
  calculated_by: z.string(),
  is_stale: z.boolean(),
  breakdown: z.object({
    materials: z.array(materialCostBreakdownSchema),
    operations: z.array(operationCostBreakdownSchema),
    routing: routingCostBreakdownSchema,
    overhead: overheadBreakdownSchema,
  }),
  margin_analysis: z.object({
    std_price: z.number().nullable(),
    target_margin_percent: z.number(),
    actual_margin_percent: z.number().nullable(),
    below_target: z.boolean(),
  }).optional(),
})

export type BOMCostResponseSchema = z.infer<typeof bomCostResponseSchema>

/**
 * Recalculate Cost Response Schema
 */
export const recalculateCostResponseSchema = z.object({
  success: z.boolean(),
  cost: bomCostResponseSchema,
  calculated_at: z.string().datetime(),
  warnings: z.array(z.string()).optional(),
})

export type RecalculateCostResponseSchema = z.infer<typeof recalculateCostResponseSchema>

/**
 * Routing Cost Response Schema
 */
export const routingCostResponseSchema = z.object({
  routing_id: z.string().uuid(),
  routing_code: z.string(),
  total_operation_cost: z.number().min(0),
  total_routing_cost: z.number().min(0),
  total_cost: z.number().min(0),
  currency: z.string(),
  breakdown: z.object({
    operations: z.array(operationCostBreakdownSchema),
    routing: routingCostBreakdownSchema,
  }),
})

export type RoutingCostResponseSchema = z.infer<typeof routingCostResponseSchema>
