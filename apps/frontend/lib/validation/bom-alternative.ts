/**
 * BOM Alternative Validation Schemas (Story 02.6)
 * Zod schemas for BOM alternative request validation
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
 * Schema for creating an alternative ingredient
 *
 * Validates:
 * - alternative_product_id: Required, must be valid UUID
 * - quantity: Required, must be > 0, max 6 decimal places
 * - uom: Required, must be non-empty string
 * - preference_order: Optional, must be >= 2 if provided
 * - notes: Optional, max 500 characters, nullable
 */
export const createAlternativeSchema = z.object({
  alternative_product_id: z
    .string({
      required_error: 'Alternative component is required',
      invalid_type_error: 'Invalid product ID',
    })
    .uuid('Alternative component is required'),

  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be greater than 0')
    .refine(hasValidDecimalPlaces, {
      message: 'Maximum 6 decimal places allowed',
    }),

  uom: z
    .string({
      required_error: 'Unit of measure is required',
      invalid_type_error: 'Invalid unit of measure',
    })
    .min(1, 'Unit of measure is required'),

  preference_order: z
    .number()
    .int('Preference must be a whole number')
    .min(2, 'Preference must be 2 or higher (1 is reserved for primary)')
    .optional(),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .nullable()
    .optional(),
})

/**
 * Schema for updating an alternative ingredient
 * All fields optional, but validation still applies if provided
 */
export const updateAlternativeSchema = z.object({
  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .refine(hasValidDecimalPlaces, {
      message: 'Maximum 6 decimal places allowed',
    })
    .optional(),

  uom: z
    .string()
    .min(1, 'Unit of measure is required')
    .optional(),

  preference_order: z
    .number()
    .int('Preference must be a whole number')
    .min(2, 'Preference must be 2 or higher')
    .optional(),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .nullable()
    .optional(),
})

/**
 * Type inference from schemas
 */
export type CreateAlternativeInput = z.infer<typeof createAlternativeSchema>
export type UpdateAlternativeInput = z.infer<typeof updateAlternativeSchema>
