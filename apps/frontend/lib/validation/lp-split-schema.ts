/**
 * LP Split Validation Schemas (Story 05.17)
 * Purpose: Zod validation schemas for LP Split operation
 *
 * Exports:
 * - SplitLPSchema: Basic split input validation
 * - SplitLPRequestSchema: Full split request with LP ID
 * - validateSplitWithContext: Context-aware validation (requires source LP)
 *
 * Acceptance Criteria Coverage:
 * - AC-2: Split Quantity Validation (Valid)
 * - AC-3: Split Quantity Validation (Invalid - >= source)
 * - AC-4: Split Quantity Validation (Invalid - Zero/Negative)
 * - AC-5: Destination Location Selection
 * - AC-14: API Endpoint - Success Request Body
 * - AC-15: API Endpoint - Validation Error
 * - AC-25: Edge Case - Split Decimals
 */

import { z } from 'zod'

// =============================================================================
// Split LP Schema - Basic Input Validation
// =============================================================================

export const SplitLPSchema = z.object({
  splitQty: z
    .number({
      required_error: 'Split quantity is required',
      invalid_type_error: 'Split quantity must be a number',
    })
    .positive('Split quantity must be greater than 0')
    .finite('Split quantity must be a valid number'),
  destinationLocationId: z
    .string()
    .uuid('Invalid location ID')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
})

// =============================================================================
// Split LP Request Schema - Full Request with LP ID
// =============================================================================

export const SplitLPRequestSchema = z.object({
  lpId: z.string().uuid('Invalid LP ID'),
  splitQty: z
    .number({
      required_error: 'Split quantity is required',
      invalid_type_error: 'Split quantity must be a number',
    })
    .positive('Split quantity must be greater than 0')
    .finite('Split quantity must be a valid number'),
  destinationLocationId: z
    .string()
    .uuid('Invalid location ID')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
})

// =============================================================================
// Context-Aware Validation Function
// =============================================================================

export interface SplitContextValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate split quantity against source LP quantity
 * Used for additional validation after schema validation
 *
 * @param splitQty - The quantity to split off
 * @param sourceLpQty - The current quantity of the source LP
 * @returns Validation result with error message if invalid
 */
export function validateSplitWithContext(
  splitQty: number,
  sourceLpQty: number
): SplitContextValidationResult {
  // Check for zero or negative
  if (splitQty <= 0) {
    return {
      valid: false,
      error: 'Split quantity must be greater than 0',
    }
  }

  // Check against source quantity (must be strictly less than)
  if (splitQty >= sourceLpQty) {
    return {
      valid: false,
      error: `Split quantity must be less than current LP quantity (${sourceLpQty})`,
    }
  }

  return { valid: true }
}

// =============================================================================
// Type Exports
// =============================================================================

export type SplitLPInput = z.infer<typeof SplitLPSchema>
export type SplitLPRequestInput = z.infer<typeof SplitLPRequestSchema>
