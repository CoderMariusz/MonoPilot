/**
 * TO License Plate Validation Schemas
 * Story: 03.9b - TO License Plate Pre-selection
 *
 * Validates request/response bodies for LP assignment to Transfer Order lines
 *
 * Schemas:
 * - LPAssignmentSchema: Single LP assignment validation
 * - AssignLPsRequestSchema: Bulk LP assignment request
 * - AvailableLPsQuerySchema: Query params for available LPs endpoint
 *
 * Business Rules:
 * - lp_id must be valid UUID
 * - quantity must be positive (> 0)
 * - quantity must not exceed max (99999.9999)
 * - At least one LP must be assigned
 * - Max 100 LPs per assignment request
 * - Date filters must be YYYY-MM-DD format
 */

import { z } from 'zod'

/**
 * Single LP Assignment Schema
 * Validates individual LP selection with quantity
 */
export const LPAssignmentSchema = z.object({
  lp_id: z.string().uuid('Invalid LP ID'),
  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .max(99999.9999, 'Quantity too large'),
})

export type LPAssignmentInput = z.infer<typeof LPAssignmentSchema>

/**
 * Assign LPs Request Schema
 * Validates POST /assign-lps request body
 */
export const AssignLPsRequestSchema = z.object({
  lps: z
    .array(LPAssignmentSchema)
    .min(1, 'At least one License Plate must be assigned')
    .max(100, 'Cannot assign more than 100 License Plates at once'),
})

export type AssignLPsRequestInput = z.infer<typeof AssignLPsRequestSchema>

/**
 * Available LPs Query Schema
 * Validates GET /available-lps query parameters
 */
export const AvailableLPsQuerySchema = z.object({
  lot_number: z.string().max(50, 'Lot number too long').optional(),
  expiry_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  expiry_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  search: z.string().max(100, 'Search term too long').optional(),
})

export type AvailableLPsQueryInput = z.infer<typeof AvailableLPsQuerySchema>

/**
 * Remove LP Request Schema
 * Validates DELETE /lps/:lpId request
 */
export const RemoveLPRequestSchema = z.object({
  lp_id: z.string().uuid('Invalid LP ID'),
})

export type RemoveLPRequestInput = z.infer<typeof RemoveLPRequestSchema>
