/**
 * Quality Hold Validation Schemas
 * Story: 06.2 - Quality Holds CRUD
 *
 * Zod schemas for validating quality hold operations
 */

import { z } from 'zod'

/**
 * Hold type enum values
 */
export const HOLD_TYPES = ['qa_pending', 'investigation', 'recall', 'quarantine'] as const
export type HoldType = (typeof HOLD_TYPES)[number]

/**
 * Priority enum values
 */
export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type Priority = (typeof PRIORITIES)[number]

/**
 * Hold status enum values
 */
export const HOLD_STATUSES = ['active', 'released', 'disposed'] as const
export type HoldStatus = (typeof HOLD_STATUSES)[number]

/**
 * Disposition enum values
 */
export const DISPOSITIONS = ['release', 'rework', 'scrap', 'return'] as const
export type Disposition = (typeof DISPOSITIONS)[number]

/**
 * Reference type enum values
 */
export const REFERENCE_TYPES = ['lp', 'wo', 'batch'] as const
export type ReferenceType = (typeof REFERENCE_TYPES)[number]

/**
 * Schema for hold item
 */
export const holdItemSchema = z.object({
  reference_type: z.enum(REFERENCE_TYPES),
  reference_id: z.string().uuid('Invalid reference ID'),
  quantity_held: z
    .number()
    .positive('quantity_held must be positive')
    .optional()
    .nullable(),
  uom: z.string().max(20, 'uom must not exceed 20 characters').optional().nullable(),
  notes: z.string().max(500, 'notes must not exceed 500 characters').optional().nullable(),
})

/**
 * Schema for creating a hold (POST)
 */
export const createHoldSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters'),
  hold_type: z.enum(HOLD_TYPES),
  priority: z.enum(PRIORITIES).default('medium'),
  items: z
    .array(holdItemSchema)
    .min(1, 'At least one item must be added to the hold'),
})

/**
 * Schema for releasing a hold (PATCH)
 */
export const releaseHoldSchema = z.object({
  disposition: z.enum(DISPOSITIONS),
  release_notes: z
    .string()
    .min(10, 'Release notes must be at least 10 characters')
    .max(1000, 'Release notes must not exceed 1000 characters'),
})

/**
 * Schema for hold list filters
 */
export const holdListFiltersSchema = z.object({
  status: z.array(z.enum(HOLD_STATUSES)).optional(),
  priority: z.array(z.enum(PRIORITIES)).optional(),
  hold_type: z.array(z.enum(HOLD_TYPES)).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sort: z.string().optional(),
})

/**
 * Type inference from schemas
 */
export type CreateHoldInput = z.infer<typeof createHoldSchema>
export type ReleaseHoldInput = z.infer<typeof releaseHoldSchema>
export type HoldItemInput = z.infer<typeof holdItemSchema>
export type HoldListFilters = z.infer<typeof holdListFiltersSchema>
