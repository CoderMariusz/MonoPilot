/**
 * BOM Validation Schemas (Story 02.4)
 * Zod schemas for BOM creation and update validation
 */

import { z } from 'zod'

// ============================================
// CONSTANTS
// ============================================

/** Maximum allowed output quantity for BOMs (prevents overflow) */
export const MAX_OUTPUT_QTY = 999999999

/** Maximum allowed length for BOM notes field */
export const MAX_NOTES_LENGTH = 2000

/** Maximum allowed length for unit of measure field */
export const MAX_UOM_LENGTH = 20

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validates ISO date string format (YYYY-MM-DD or full ISO datetime)
 * Rejects formats like MM/DD/YYYY which JavaScript can parse but aren't ISO
 *
 * @param val - The date string to validate
 * @returns true if the date string is a valid ISO format
 *
 * @example
 * isValidISODateString('2024-01-15') // true
 * isValidISODateString('2024-01-15T10:30:00Z') // true
 * isValidISODateString('01/15/2024') // false
 */
export const isValidISODateString = (val: string): boolean => {
  // Check YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return !isNaN(Date.parse(val))
  }
  // Check full ISO datetime format (must start with YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
    return !isNaN(Date.parse(val))
  }
  // Reject all other formats including MM/DD/YYYY
  return false
}

// Backward compatibility alias
const isValidDateString = isValidISODateString

// ============================================
// SCHEMAS
// ============================================

/**
 * Schema for creating a new BOM
 *
 * Validates:
 * - product_id: Valid UUID
 * - effective_from: Required ISO date string
 * - effective_to: Optional ISO date string (null = ongoing)
 * - status: 'draft' or 'active' (defaults to 'draft')
 * - output_qty: Positive number up to MAX_OUTPUT_QTY
 * - output_uom: Required string up to MAX_UOM_LENGTH
 * - notes: Optional string up to MAX_NOTES_LENGTH
 *
 * Refinements:
 * - effective_to must be >= effective_from if both provided
 * AC-09, AC-13: Date range validation
 * AC-12: Date ordering (effective_to > effective_from)
 * AC-13: Output quantity validation (> 0)
 */
export const createBOMSchema = z
  .object({
    product_id: z.string().uuid('Invalid product'),
    effective_from: z
      .string()
      .refine((val) => isValidDateString(val), 'Invalid date'),
    effective_to: z
      .string()
      .refine((val) => !val || isValidDateString(val), 'Invalid date')
      .nullable()
      .optional(),
    status: z.enum(['draft', 'active']).default('draft'),
    output_qty: z
      .number()
      .positive('Output quantity must be greater than 0')
      .max(MAX_OUTPUT_QTY, 'Output quantity too large'),
    output_uom: z
      .string()
      .min(1, 'Unit of measure is required')
      .max(MAX_UOM_LENGTH, 'Unit of measure too long'),
    notes: z.string().max(MAX_NOTES_LENGTH, 'Notes too long').optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.effective_to && data.effective_from) {
        return new Date(data.effective_to) >= new Date(data.effective_from)
      }
      return true
    },
    {
      message: 'Effective To must be after Effective From',
      path: ['effective_to'],
    }
  )

/**
 * Schema for updating an existing BOM
 *
 * All fields are optional for partial updates.
 * Status can include all valid BOM statuses (draft, active, phased_out, inactive).
 *
 * @see AC-14 to AC-17 Edit BOM (product locked)
 */
export const updateBOMSchema = z
  .object({
    effective_from: z
      .string()
      .refine((val) => isValidDateString(val), 'Invalid date')
      .optional(),
    effective_to: z
      .string()
      .refine((val) => !val || isValidDateString(val), 'Invalid date')
      .nullable()
      .optional(),
    status: z.enum(['draft', 'active', 'phased_out', 'inactive']).optional(),
    output_qty: z
      .number()
      .positive('Output quantity must be greater than 0')
      .max(MAX_OUTPUT_QTY, 'Output quantity too large')
      .optional(),
    output_uom: z
      .string()
      .min(1, 'Unit of measure is required')
      .max(MAX_UOM_LENGTH, 'Unit of measure too long')
      .optional(),
    notes: z.string().max(MAX_NOTES_LENGTH, 'Notes too long').nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.effective_to && data.effective_from) {
        return new Date(data.effective_to) >= new Date(data.effective_from)
      }
      return true
    },
    {
      message: 'Effective To must be after Effective From',
      path: ['effective_to'],
    }
  )

export type CreateBOMInput = z.infer<typeof createBOMSchema>
export type UpdateBOMInput = z.infer<typeof updateBOMSchema>
