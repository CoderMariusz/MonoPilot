/**
 * Product Version History Validation Schemas (Story 02.2)
 * Zod schemas for validating history endpoint parameters and JSONB data
 */

import { z } from 'zod'

/**
 * Schema for versions list query parameters
 * Validates: page, limit
 */
export const versionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Schema for history query parameters with date range filters
 * Validates: page, limit, from_date, to_date
 * Refines: from_date must be before to_date
 */
export const historyQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    from_date: z.string().datetime().optional(),
    to_date: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.from_date && data.to_date) {
        return new Date(data.from_date) <= new Date(data.to_date)
      }
      return true
    },
    { message: 'from_date must be before to_date' }
  )

/**
 * Schema for changed_fields JSONB structure
 * Format: { field_name: { old: any, new: any } }
 * Note: Both old and new are required to prevent partial objects
 * Uses superRefine for strict validation that enforces both properties
 */
export const changedFieldsSchema = z.record(
  z.string(),
  z.any().superRefine((val, ctx) => {
    // Validate it's an object
    if (typeof val !== 'object' || val === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Value must be an object',
      })
      return
    }

    // Enforce both 'old' and 'new' properties exist
    if (!('old' in val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Missing required property: old',
      })
    }
    if (!('new' in val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Missing required property: new',
      })
    }

    // Reject extra properties (strict mode)
    const allowedKeys = ['old', 'new']
    const extraKeys = Object.keys(val).filter(key => !allowedKeys.includes(key))
    if (extraKeys.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unexpected properties: ${extraKeys.join(', ')}`,
      })
    }
  })
)
