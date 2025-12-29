/**
 * Traceability Validation Schemas - Story 02.10a
 * Purpose: Zod schemas for traceability configuration CRUD operations
 *
 * Validation rules:
 * - Lot format must contain valid placeholders ({YYYY}, {YY}, {MM}, {DD}, {SEQ:N}, {JULIAN}, {PROD}, {LINE})
 * - Batch size constraints: min <= standard <= max
 * - Rolling expiry method requires processing_buffer_days > 0
 * - Sequence length must be 4-10 digits
 * - Processing buffer days must be 0-365
 *
 * Coverage Target: 90%+
 */

import { z } from 'zod'

// Valid lot format placeholders (uppercase only)
const LOT_PLACEHOLDERS = ['{YYYY}', '{YY}', '{MM}', '{DD}', '{JULIAN}', '{PROD}', '{LINE}', '{YYMMDD}']
const LOT_SEQ_PATTERN = /\{SEQ:\d+\}/

/**
 * Validate lot number format string
 * - Must contain at least one valid placeholder
 * - All placeholders must be valid (uppercase, correct syntax)
 * - SEQ must include length specifier (e.g., {SEQ:6})
 */
function validateLotFormat(format: string): boolean {
  // Check for at least one valid placeholder or SEQ pattern
  const hasValidPlaceholder =
    LOT_PLACEHOLDERS.some((p) => format.includes(p)) || LOT_SEQ_PATTERN.test(format)

  if (!hasValidPlaceholder) {
    return false
  }

  // Check all placeholders in the format
  const placeholderPattern = /\{([^}]*)\}/g
  let match

  while ((match = placeholderPattern.exec(format)) !== null) {
    const content = match[1]
    const placeholder = `{${content}}`

    // Check if it's a valid standard placeholder
    if (LOT_PLACEHOLDERS.includes(placeholder)) {
      continue
    }

    // Check if it's a valid SEQ placeholder with length
    if (/^SEQ:\d+$/.test(content)) {
      continue
    }

    // Invalid placeholder found
    return false
  }

  return true
}

/**
 * Base object schema without refinements
 */
const baseConfigObject = z.object({
  lot_number_format: z
    .string()
    .min(5, 'Lot format must be at least 5 characters')
    .max(50, 'Lot format cannot exceed 50 characters')
    .refine(validateLotFormat, {
      message:
        'Invalid lot format. Use uppercase placeholders like {YYYY}, {MM}, {DD}, {SEQ:6}, {JULIAN}, {PROD}, {LINE}'
    }),

  lot_number_prefix: z
    .string()
    .min(1, 'Prefix must be at least 1 character')
    .max(20, 'Prefix cannot exceed 20 characters')
    .optional(),

  lot_number_sequence_length: z
    .number()
    .int('Sequence length must be an integer')
    .min(4, 'Sequence length must be at least 4')
    .max(10, 'Sequence length cannot exceed 10')
    .optional(),

  traceability_level: z.enum(['lot', 'batch', 'serial']).default('lot'),

  standard_batch_size: z.number().positive('Standard batch size must be positive').nullable().optional(),

  min_batch_size: z.number().positive('Minimum batch size must be positive').nullable().optional(),

  max_batch_size: z.number().positive('Maximum batch size must be positive').nullable().optional(),

  expiry_calculation_method: z.enum(['fixed_days', 'rolling', 'manual']).default('fixed_days'),

  processing_buffer_days: z
    .number()
    .int('Buffer days must be an integer')
    .min(0, 'Buffer days cannot be negative')
    .max(365, 'Buffer days cannot exceed 365')
    .optional()
    .default(0),

  gs1_lot_encoding_enabled: z.boolean().default(false),
  gs1_expiry_encoding_enabled: z.boolean().default(false),
  gs1_sscc_enabled: z.boolean().default(false)
})

/**
 * Refinement function for cross-field validation
 */
function addRefinements<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .refine(
      (data: z.infer<typeof baseConfigObject>) => {
        if (data.min_batch_size != null && data.max_batch_size != null) {
          return data.min_batch_size <= data.max_batch_size
        }
        return true
      },
      {
        message: 'Minimum batch size cannot exceed maximum batch size',
        path: ['min_batch_size']
      }
    )
    .refine(
      (data: z.infer<typeof baseConfigObject>) => {
        if (data.standard_batch_size != null && data.min_batch_size != null) {
          return data.standard_batch_size >= data.min_batch_size
        }
        return true
      },
      {
        message: 'Standard batch size must be at least the minimum',
        path: ['standard_batch_size']
      }
    )
    .refine(
      (data: z.infer<typeof baseConfigObject>) => {
        if (data.standard_batch_size != null && data.max_batch_size != null) {
          return data.standard_batch_size <= data.max_batch_size
        }
        return true
      },
      {
        message: 'Standard batch size cannot exceed maximum',
        path: ['standard_batch_size']
      }
    )
    .refine(
      (data: z.infer<typeof baseConfigObject>) => {
        if (data.expiry_calculation_method === 'rolling') {
          return data.processing_buffer_days != null && data.processing_buffer_days > 0
        }
        return true
      },
      {
        message: 'Processing buffer days required for rolling expiry method (must be > 0)',
        path: ['processing_buffer_days']
      }
    )
}

/**
 * Base traceability config schema with all fields and refinements
 * Used for both create and update operations
 */
export const traceabilityConfigSchema = addRefinements(baseConfigObject)

/**
 * Schema for creating new traceability config
 * All fields required except those with defaults
 */
export const createTraceabilityConfigSchema = traceabilityConfigSchema

/**
 * Schema for updating existing traceability config
 * All fields optional - only update provided fields
 */
export const updateTraceabilityConfigSchema = addRefinements(baseConfigObject.partial())

/**
 * Inferred TypeScript type from schema
 */
export type TraceabilityConfigInput = z.infer<typeof traceabilityConfigSchema>
