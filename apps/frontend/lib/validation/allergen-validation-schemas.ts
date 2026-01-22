/**
 * Allergen Validation Schemas
 * Story: 07.6 - SO Allergen Validation
 *
 * Provides Zod validation schemas for:
 * - Allergen validation request
 * - Override allergen request
 * - Customer order history query params
 */

import { z } from 'zod'

// ============================================================================
// Validate Allergens Schema
// ============================================================================

/**
 * Schema for allergen validation request
 * POST /api/shipping/sales-orders/:id/validate-allergens
 *
 * Body is empty - validation uses SO ID from URL
 */
export const validateAllergensSchema = z.object({}).strict()

export type ValidateAllergensInput = z.infer<typeof validateAllergensSchema>

// ============================================================================
// Override Allergen Schema
// ============================================================================

/**
 * Override reason validation rules:
 * - Required field
 * - Minimum 20 characters (after trim)
 * - Maximum 500 characters
 * - Whitespace-only strings rejected
 */
export const overrideAllergenSchema = z.object({
  reason: z
    .string({
      required_error: 'Reason is required',
      invalid_type_error: 'Reason must be a string',
    })
    .transform((val) => val.trim())
    .refine((val) => val.length >= 20, {
      message: 'Reason must be at least 20 characters',
    })
    .refine((val) => val.length <= 500, {
      message: 'Reason cannot exceed 500 characters',
    }),
  confirmed: z
    .boolean({
      required_error: 'Confirmed flag is required',
      invalid_type_error: 'Confirmed must be a boolean',
    })
    .refine((val) => val === true, {
      message: 'Override must be confirmed',
    }),
})

export type OverrideAllergenInput = z.infer<typeof overrideAllergenSchema>

// ============================================================================
// Customer Order History Schema
// ============================================================================

/**
 * Query params for customer order history
 * GET /api/shipping/customers/:id/orders
 */
export const customerOrderHistorySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, {
      message: 'Page must be >= 1',
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 20
      const num = parseInt(val, 10)
      return Math.min(num, 100) // Cap at 100
    })
    .refine((val) => val >= 1, {
      message: 'Limit must be between 1-100',
    }),
  status: z.string().optional(),
})

export type CustomerOrderHistoryQuery = z.infer<typeof customerOrderHistorySchema>

// ============================================================================
// Error Response Types
// ============================================================================

export interface AllergenValidationError {
  code: string
  message: string
  details?: Array<{ field: string; message: string }>
}

// ============================================================================
// Constants
// ============================================================================

/**
 * SO statuses that allow allergen validation
 */
export const VALIDATION_ALLOWED_STATUSES = ['draft', 'confirmed', 'on_hold'] as const

/**
 * Roles that can validate allergens
 */
export const VALIDATION_ALLOWED_ROLES = [
  'admin',
  'owner',
  'super_admin',
  'superadmin',
  'manager',
  'sales',
  'sales clerk',
] as const

/**
 * Roles that can override allergen blocks (Manager+ only)
 */
export const OVERRIDE_ALLOWED_ROLES = [
  'admin',
  'owner',
  'super_admin',
  'superadmin',
  'manager',
] as const
