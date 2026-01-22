/**
 * Pricing Validation Schemas (Story 07.4)
 *
 * Zod schemas for validating SO line pricing operations.
 * Used by API routes for creating and updating SO lines with pricing.
 *
 * Validation rules:
 * - quantity_ordered: > 0 (positive decimal)
 * - unit_price: > 0 (positive decimal)
 * - discount.type: 'percent' | 'fixed'
 * - discount.value: >= 0 (non-negative)
 * - discount.value (percent): <= 100
 *
 * @module pricing-schemas
 */

import { z } from 'zod'

/**
 * Discount type enum
 */
export const DiscountType = z.enum(['percent', 'fixed'])
export type DiscountTypeValue = z.infer<typeof DiscountType>

/**
 * Discount schema for SO line pricing
 *
 * AC9: Validate non-negative discount
 * AC10: Validate percentage discount <= 100%
 */
export const discountSchema = z
  .object({
    type: DiscountType,
    value: z
      .number({
        required_error: 'Discount value is required',
        invalid_type_error: 'Discount value must be a number',
      })
      .min(0, 'Discount cannot be negative'),
  })
  .refine(
    (data) => {
      if (data.type === 'percent' && data.value > 100) {
        return false
      }
      return true
    },
    {
      message: 'Percentage discount cannot exceed 100%',
    }
  )
  .nullable()
  .optional()

export type Discount = z.infer<typeof discountSchema>

/**
 * Create SO line schema (POST /api/shipping/sales-orders/:id/lines)
 *
 * AC1: Auto-populate unit_price from product master (optional field)
 * AC2: Calculate line_total on quantity/price change
 * AC8: Validate positive unit_price
 */
export const createSOLineSchema = z.object({
  product_id: z
    .string({
      required_error: 'Product ID is required',
      invalid_type_error: 'Product ID must be a string',
    })
    .uuid('Invalid product ID'),

  quantity_ordered: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be greater than zero'),

  unit_price: z
    .number({
      invalid_type_error: 'Unit price must be a number',
    })
    .positive('Unit price must be greater than zero')
    .optional(), // Optional - will auto-populate from product.std_price if not provided

  discount: discountSchema,

  requested_lot: z
    .string()
    .max(100, 'Requested lot must be at most 100 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  notes: z
    .string()
    .max(2000, 'Notes must be at most 2000 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
})

export type CreateSOLineInput = z.infer<typeof createSOLineSchema>

/**
 * Update SO line schema (PUT /api/shipping/sales-orders/:id/lines/:lineId)
 *
 * All fields optional for partial updates.
 * AC6: Recalculate totals on line edit
 */
export const updateSOLineSchema = z.object({
  quantity_ordered: z
    .number({
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be greater than zero')
    .optional(),

  unit_price: z
    .number({
      invalid_type_error: 'Unit price must be a number',
    })
    .positive('Unit price must be greater than zero')
    .optional(),

  discount: discountSchema,

  requested_lot: z
    .string()
    .max(100, 'Requested lot must be at most 100 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  notes: z
    .string()
    .max(2000, 'Notes must be at most 2000 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
})

export type UpdateSOLineInput = z.infer<typeof updateSOLineSchema>

/**
 * Update pricing-only schema (PATCH /api/shipping/sales-orders/:id/lines/:lineId/pricing)
 * Used for updating just pricing fields without other line data.
 */
export const updateLinePricingSchema = z.object({
  unit_price: z
    .number({
      invalid_type_error: 'Unit price must be a number',
    })
    .positive('Unit price must be greater than zero')
    .optional(),

  discount: discountSchema,
})

export type UpdateLinePricingInput = z.infer<typeof updateLinePricingSchema>

/**
 * Bulk line creation schema for creating multiple lines at once
 */
export const bulkCreateSOLinesSchema = z.object({
  lines: z.array(createSOLineSchema).min(1, 'At least one line is required'),
})

export type BulkCreateSOLinesInput = z.infer<typeof bulkCreateSOLinesSchema>

/**
 * SO line response schema (for type inference in API responses)
 */
export const soLineResponseSchema = z.object({
  id: z.string().uuid(),
  sales_order_id: z.string().uuid(),
  org_id: z.string().uuid(),
  line_number: z.number().int(),
  product_id: z.string().uuid(),
  quantity_ordered: z.number(),
  quantity_allocated: z.number().default(0),
  quantity_picked: z.number().default(0),
  quantity_packed: z.number().default(0),
  quantity_shipped: z.number().default(0),
  unit_price: z.number(),
  line_total: z.number().nullable(),
  discount: discountSchema,
  requested_lot: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
})

export type SOLineResponse = z.infer<typeof soLineResponseSchema>

/**
 * API response schema for single line operations
 */
export const soLineApiResponseSchema = z.object({
  success: z.boolean(),
  line: soLineResponseSchema,
  so_total: z.number(),
})

export type SOLineApiResponse = z.infer<typeof soLineApiResponseSchema>

/**
 * API response schema for delete operations
 */
export const deleteLineApiResponseSchema = z.object({
  success: z.boolean(),
  so_total: z.number(),
})

export type DeleteLineApiResponse = z.infer<typeof deleteLineApiResponseSchema>
