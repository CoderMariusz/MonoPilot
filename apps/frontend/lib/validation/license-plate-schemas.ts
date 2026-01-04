/**
 * License Plate Validation Schemas (Story 05.1)
 * Purpose: Zod validation schemas for LP operations
 *
 * Exports:
 * - Enum schemas: lpStatusEnum, qaStatusEnum, lpSourceEnum
 * - CRUD schemas: createLPSchema, updateLPSchema
 * - Epic 04 schemas: consumeLPSchema, createOutputLPSchema
 * - Query schema: lpQuerySchema
 * - Status schemas: updateQAStatusSchema, blockLPSchema
 */

import { z } from 'zod'

// =============================================================================
// Enum Schemas
// =============================================================================

export const lpStatusEnum = z.enum(['available', 'reserved', 'consumed', 'blocked'])
export const qaStatusEnum = z.enum(['pending', 'passed', 'failed', 'quarantine'])
export const lpSourceEnum = z.enum(['manual', 'receipt', 'production', 'return', 'adjustment', 'split'])

// =============================================================================
// Create LP Schema
// =============================================================================

export const createLPSchema = z.object({
  lp_number: z.string()
    .min(1, "LP number is required if manual entry")
    .max(50, "LP number max 50 characters")
    .optional(),
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number()
    .positive("Quantity must be positive")
    .max(999999999, "Quantity too large"),
  uom: z.string()
    .min(1, "UoM is required")
    .max(20, "UoM max 20 characters"),
  location_id: z.string().uuid("Invalid location ID"),
  warehouse_id: z.string().uuid("Invalid warehouse ID"),
  batch_number: z.string().max(100).nullable().optional(),
  supplier_batch_number: z.string().max(100).nullable().optional(),
  expiry_date: z.string().datetime().nullable().optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()),
  manufacture_date: z.string().datetime().nullable().optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()),
  source: lpSourceEnum.default('manual'),
  po_number: z.string().max(50).nullable().optional(),
  grn_id: z.string().uuid().nullable().optional(),
  asn_id: z.string().uuid().nullable().optional(),
  wo_id: z.string().uuid().nullable().optional(),
  catch_weight_kg: z.number().positive().nullable().optional(),
  gtin: z.string().length(14, "GTIN must be 14 digits").nullable().optional(),
})

// =============================================================================
// Update LP Schema
// =============================================================================

export const updateLPSchema = z.object({
  quantity: z.number().positive("Quantity must be positive").max(999999999).optional(),
  location_id: z.string().uuid().optional(),
  batch_number: z.string().max(100).nullable().optional(),
  supplier_batch_number: z.string().max(100).nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  manufacture_date: z.string().nullable().optional(),
  catch_weight_kg: z.number().positive().nullable().optional(),
})

// =============================================================================
// Consume LP Schema (CRITICAL for Epic 04)
// =============================================================================

export const consumeLPSchema = z.object({
  lp_id: z.string().uuid("Invalid LP ID"),
  consume_qty: z.number().positive("Consume quantity must be positive"),
  wo_id: z.string().uuid("Invalid WO ID"),
  operation_id: z.string().uuid().optional(),
})

// =============================================================================
// Create Output LP Schema (CRITICAL for Epic 04)
// =============================================================================

export const createOutputLPSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number().positive("Quantity must be positive"),
  uom: z.string().min(1, "UoM is required"),
  location_id: z.string().uuid("Invalid location ID"),
  warehouse_id: z.string().uuid("Invalid warehouse ID"),
  wo_id: z.string().uuid("Invalid WO ID"),
  batch_number: z.string().max(100).optional(),
  expiry_date: z.string().optional(),
  manufacture_date: z.string().optional(),
  qa_status: qaStatusEnum.default('pending'),
  catch_weight_kg: z.number().positive().optional(),
})

// =============================================================================
// LP Query Schema
// =============================================================================

export const lpQuerySchema = z.object({
  search: z.string().min(1).optional(),
  warehouse_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  status: lpStatusEnum.optional(),
  qa_status: qaStatusEnum.optional(),
  batch_number: z.string().optional(),
  expiry_before: z.string().optional(),
  expiry_after: z.string().optional(),
  sort: z.enum(['lp_number', 'created_at', 'expiry_date', 'quantity']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100, "Limit max 100").default(50),
})

// =============================================================================
// Update QA Status Schema
// =============================================================================

export const updateQAStatusSchema = z.object({
  qa_status: qaStatusEnum,
})

// =============================================================================
// Block LP Schema
// =============================================================================

export const blockLPSchema = z.object({
  reason: z.string().max(500, "Reason max 500 characters").nullable().optional(),
})

// =============================================================================
// Type Exports
// =============================================================================

export type CreateLPInput = z.infer<typeof createLPSchema>
export type UpdateLPInput = z.infer<typeof updateLPSchema>
export type ConsumeLPInput = z.infer<typeof consumeLPSchema>
export type CreateOutputLPInput = z.infer<typeof createOutputLPSchema>
export type LPQueryParams = z.infer<typeof lpQuerySchema>
export type LPStatus = z.infer<typeof lpStatusEnum>
export type QAStatus = z.infer<typeof qaStatusEnum>
export type LPSource = z.infer<typeof lpSourceEnum>
