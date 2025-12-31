/**
 * Supplier Product Validation Schemas
 * Story: 03.2 - Supplier-Product Assignment
 *
 * Zod schemas for validating supplier-product assignments
 */

import { z } from 'zod'

/**
 * Schema for assigning a product to a supplier (POST)
 */
export const assignProductSchema = z.object({
  product_id: z.string().uuid('Product ID must be a valid UUID'),
  is_default: z.boolean().default(false),
  supplier_product_code: z
    .string()
    .max(50, 'Max 50 characters')
    .optional()
    .nullable(),
  unit_price: z
    .number()
    .positive('Price must be positive')
    .optional()
    .nullable(),
  currency: z
    .enum(['PLN', 'EUR', 'USD', 'GBP'], {
      errorMap: () => ({ message: 'Invalid currency' }),
    })
    .optional()
    .nullable(),
  lead_time_days: z
    .number()
    .int('Must be a whole number')
    .nonnegative('Cannot be negative')
    .optional()
    .nullable(),
  moq: z
    .number()
    .positive('MOQ must be positive')
    .optional()
    .nullable(),
  order_multiple: z
    .number()
    .positive('Order multiple must be positive')
    .optional()
    .nullable(),
  notes: z.string().max(1000, 'Max 1000 characters').optional().nullable(),
})

/**
 * Schema for updating a supplier-product assignment (PUT)
 * Same as assign but product_id is not required
 */
export const updateSupplierProductSchema = assignProductSchema
  .partial()
  .omit({ product_id: true })

/**
 * Type inference from schemas
 */
export type AssignProductInput = z.infer<typeof assignProductSchema>
export type UpdateSupplierProductInput = z.infer<typeof updateSupplierProductSchema>

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]
