/**
 * LP Merge Validation Schemas (Story 05.18)
 * Purpose: Zod validation schemas for LP merge operations
 *
 * Exports:
 * - validateMergeSchema: For /api/warehouse/license-plates/validate-merge
 * - mergeLPSchema: For /api/warehouse/license-plates/merge
 */

import { z } from 'zod'

// =============================================================================
// Validate Merge Schema
// For POST /api/warehouse/license-plates/validate-merge
// =============================================================================

export const validateMergeSchema = z.object({
  sourceLpIds: z
    .array(z.string().uuid('Invalid LP ID'))
    .min(2, 'At least 2 LPs required for merge')
    .max(20, 'Maximum 20 LPs can be merged at once'),
})

// =============================================================================
// Merge LP Schema
// For POST /api/warehouse/license-plates/merge
// =============================================================================

export const mergeLPSchema = z.object({
  sourceLpIds: z
    .array(z.string().uuid('Invalid LP ID'))
    .min(2, 'At least 2 LPs required for merge')
    .max(20, 'Maximum 20 LPs can be merged at once'),
  targetLocationId: z
    .string()
    .uuid('Invalid location ID')
    .nullable()
    .optional(),
})

// =============================================================================
// Type Exports
// =============================================================================

export type ValidateMergeInput = z.infer<typeof validateMergeSchema>
export type MergeLPInput = z.infer<typeof mergeLPSchema>
