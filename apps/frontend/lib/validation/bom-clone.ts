/**
 * BOM Clone Validation Schemas (Story 02.6)
 * Zod schemas for BOM clone request validation
 */

import { z } from 'zod'

/**
 * Schema for clone BOM request
 *
 * Validates:
 * - target_product_id: Required, must be valid UUID
 * - effective_from: Optional, must be valid date, cannot be in past
 * - effective_to: Optional, must be valid date, must be >= effective_from
 * - status: Optional, defaults to 'draft', must be 'draft' or 'active'
 * - notes: Optional, max 2000 characters
 */
export const cloneBOMSchema = z.object({
  target_product_id: z
    .string({
      required_error: 'Select target product',
      invalid_type_error: 'Invalid product ID',
    })
    .uuid('Select target product'),

  effective_from: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .refine((val) => {
      if (!val) return true
      const date = new Date(val)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date >= today
    }, {
      message: 'Effective date cannot be in the past',
    })
    .optional(),

  effective_to: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .nullable()
    .optional(),

  status: z
    .enum(['draft', 'active'], {
      errorMap: () => ({ message: 'Status must be draft or active' }),
    })
    .default('draft'),

  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional(),
}).refine((data) => {
  // Only validate date range if both dates are provided
  if (data.effective_to && data.effective_from) {
    return new Date(data.effective_to) >= new Date(data.effective_from)
  }
  return true
}, {
  message: 'Effective To must be after Effective From',
  path: ['effective_to'],
})

/**
 * Type inference from schema
 */
export type CloneBOMInput = z.infer<typeof cloneBOMSchema>
