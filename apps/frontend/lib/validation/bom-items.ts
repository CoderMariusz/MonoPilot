/**
 * BOM Items Validation Schemas - Story 02.5a + 02.5b Phase 1B
 *
 * Zod schemas for BOM items:
 * - bomItemFormSchema: Base schema with all MVP fields
 * - createBOMItemSchema: Schema for creating BOM items
 * - updateBOMItemSchema: Schema for updating BOM items (partial)
 * - bulkImportSchema: Schema for bulk import (Phase 1B)
 *
 * Validation Rules (MVP):
 * - product_id: Required, must be valid UUID
 * - quantity: Required, > 0, max 6 decimal places
 * - uom: Required, min 1 character
 * - sequence: Integer, >= 0, optional (default: 0)
 * - operation_seq: Integer, nullable, optional
 * - scrap_percent: 0-100, optional (default: 0)
 * - notes: Max 500 chars, nullable, optional
 *
 * Phase 1B Fields:
 * - consume_whole_lp: Boolean, default false
 * - line_ids: UUID array, nullable (null = all lines), empty array normalized to null
 * - is_by_product: Boolean, default false
 * - yield_percent: 0-100, required if is_by_product=true
 * - condition_flags: JSONB object with boolean flags
 */

import { z } from 'zod'

/**
 * Helper to check decimal places (max 6)
 */
function hasValidDecimalPlaces(val: number): boolean {
  const strVal = val.toString()
  const decimalPart = strVal.split('.')[1]
  return !decimalPart || decimalPart.length <= 6
}

/**
 * Helper to check decimal places (max 2) for yield_percent
 */
function hasMax2DecimalPlaces(val: number): boolean {
  const strVal = val.toString()
  const decimalPart = strVal.split('.')[1]
  return !decimalPart || decimalPart.length <= 2
}

/**
 * Condition flags JSONB schema
 */
export const conditionFlagsSchema = z
  .record(z.string(), z.boolean())
  .nullable()
  .optional()

/**
 * Line IDs array schema with empty array normalization
 */
export const lineIdsSchema = z
  .array(z.string().uuid('Invalid UUID format for line_id'))
  .nullable()
  .optional()
  .transform((val) => {
    // Normalize empty array to null
    if (val && val.length === 0) return null
    return val
  })

/**
 * Base BOM Item form schema (MVP + Phase 1B fields)
 */
export const bomItemFormSchema = z.object({
  // Required: Component product ID
  product_id: z
    .string({
      required_error: 'Component is required',
      invalid_type_error: 'Invalid product ID',
    })
    .uuid('Invalid UUID format'),

  // Required: Quantity (must be > 0, max 6 decimal places)
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be greater than 0')
    .refine(hasValidDecimalPlaces, {
      message: 'Maximum 6 decimal places allowed',
    }),

  // Required: Unit of measure
  uom: z
    .string({
      required_error: 'Unit of measure is required',
      invalid_type_error: 'Invalid unit of measure',
    })
    .min(1, 'Unit of measure is required'),

  // Optional: Sequence number (integer, >= 0, default: 0)
  sequence: z
    .number()
    .int('Sequence must be an integer')
    .min(0, 'Sequence cannot be negative')
    .optional()
    .default(0),

  // Optional: Operation sequence number (integer, nullable)
  operation_seq: z
    .number()
    .int('Operation sequence must be an integer')
    .nullable()
    .optional(),

  // Optional: Scrap percentage (0-100, default: 0)
  scrap_percent: z
    .number()
    .min(0, 'Scrap percent cannot be negative')
    .max(100, 'Scrap percent cannot exceed 100')
    .optional()
    .default(0),

  // Optional: Notes (max 500 chars, nullable)
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .nullable()
    .optional(),

  // ========================================
  // Phase 1B Fields
  // ========================================

  // Optional: Consume whole LP flag (default: false)
  consume_whole_lp: z.boolean().optional().default(false),

  // Optional: Line IDs (null = all lines, empty array normalized to null)
  line_ids: lineIdsSchema,

  // Optional: By-product flag (default: false)
  is_by_product: z.boolean().optional().default(false),

  // Optional: Yield percent (0-100, required if is_by_product=true)
  yield_percent: z
    .number()
    .min(0, 'Yield percent cannot be negative')
    .max(100, 'Yield percent cannot exceed 100')
    .refine(hasMax2DecimalPlaces, {
      message: 'Maximum 2 decimal places allowed for yield percent',
    })
    .nullable()
    .optional(),

  // Optional: Condition flags (JSONB)
  condition_flags: conditionFlagsSchema,
})

/**
 * Create BOM Item schema (same as base form)
 */
export const createBOMItemSchema = bomItemFormSchema

/**
 * Update BOM Item schema (all fields optional except validation still applies)
 * Includes Phase 1B fields
 */
export const updateBOMItemSchema = z.object({
  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .refine(hasValidDecimalPlaces, {
      message: 'Maximum 6 decimal places allowed',
    })
    .optional(),

  uom: z.string().min(1, 'Unit of measure is required').optional(),

  sequence: z
    .number()
    .int('Sequence must be an integer')
    .min(0, 'Sequence cannot be negative')
    .optional(),

  operation_seq: z
    .number()
    .int('Operation sequence must be an integer')
    .nullable()
    .optional(),

  scrap_percent: z
    .number()
    .min(0, 'Scrap percent cannot be negative')
    .max(100, 'Scrap percent cannot exceed 100')
    .optional(),

  notes: z.string().max(500, 'Notes cannot exceed 500 characters').nullable().optional(),

  // Phase 1B Fields
  consume_whole_lp: z.boolean().optional(),
  line_ids: lineIdsSchema,
  is_by_product: z.boolean().optional(),
  yield_percent: z
    .number()
    .min(0, 'Yield percent cannot be negative')
    .max(100, 'Yield percent cannot exceed 100')
    .refine(hasMax2DecimalPlaces, {
      message: 'Maximum 2 decimal places allowed for yield percent',
    })
    .nullable()
    .optional(),
  condition_flags: conditionFlagsSchema,
})

/**
 * Create BOM Item schema with conditional validation for yield_percent
 * yield_percent is required when is_by_product=true
 */
export const createBOMItemSchemaWithValidation = bomItemFormSchema.refine(
  (data) => {
    // If is_by_product is true, yield_percent must be provided and not null
    if (data.is_by_product === true) {
      return data.yield_percent !== null && data.yield_percent !== undefined
    }
    return true
  },
  {
    message: 'yield_percent is required when is_by_product=true',
    path: ['yield_percent'],
  }
)

/**
 * Bulk import schema for Phase 1B
 * Accepts array of items (min 1, max 500)
 */
export const bulkImportSchema = z.object({
  items: z
    .array(bomItemFormSchema)
    .min(1, 'At least 1 item required')
    .max(500, 'Maximum 500 items allowed'),
})

/**
 * Type inference from schemas
 */
// Output type (after parsing with defaults applied)
export type BOMItemFormOutput = z.output<typeof bomItemFormSchema>
export type CreateBOMItemOutput = z.output<typeof createBOMItemSchema>
export type UpdateBOMItemOutput = z.output<typeof updateBOMItemSchema>
export type BulkImportOutput = z.output<typeof bulkImportSchema>

// Input type (what can be passed to safeParse - allows optional fields to be omitted)
export type BOMItemFormValues = z.input<typeof bomItemFormSchema>
export type CreateBOMItemInput = z.input<typeof createBOMItemSchema>
export type UpdateBOMItemInput = z.input<typeof updateBOMItemSchema>
export type BulkImportInput = z.input<typeof bulkImportSchema>
