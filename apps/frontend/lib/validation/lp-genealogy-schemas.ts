/**
 * LP Genealogy Validation Schemas (Story 05.2)
 * Purpose: Zod validation schemas for LP Genealogy operations
 *
 * Exports:
 * - Enum schemas: operationTypeEnum
 * - Link schemas: linkConsumptionSchema, linkOutputSchema, linkSplitSchema, linkMergeSchema
 * - Query schemas: traceQuerySchema, genealogyDirectionSchema
 *
 * CRITICAL for Epic 04 Production - Material Traceability
 */

import { z } from 'zod'

// =============================================================================
// Enum Schemas
// =============================================================================

export const operationTypeEnum = z.enum(['consume', 'output', 'split', 'merge'])

export const genealogyDirectionEnum = z.enum(['forward', 'backward', 'both'])

// =============================================================================
// Link Consumption Schema (AC-3)
// =============================================================================

export const linkConsumptionSchema = z.object({
  parentLpId: z.string().uuid({ message: 'Invalid parent LP UUID' }),
  childLpId: z.string().uuid({ message: 'Invalid child LP UUID' }),
  woId: z.string().uuid({ message: 'Invalid Work Order UUID' }),
  quantity: z.number().positive({ message: 'Quantity must be positive' }),
  operationId: z.string().uuid().optional(),
}).refine(data => data.parentLpId !== data.childLpId, {
  message: 'Parent and child LP cannot be the same (self-referencing not allowed)',
  path: ['childLpId'],
})

// =============================================================================
// Link Output Schema (AC-4)
// =============================================================================

export const linkOutputSchema = z.object({
  consumedLpIds: z.array(z.string().uuid({ message: 'Invalid consumed LP UUID' })).min(1, { message: 'At least one consumed LP is required' }),
  outputLpId: z.string().uuid({ message: 'Invalid output LP UUID' }),
  woId: z.string().uuid({ message: 'Invalid Work Order UUID' }),
})

// =============================================================================
// Link Split Schema (AC-5)
// =============================================================================

export const linkSplitSchema = z.object({
  sourceLpId: z.string().uuid({ message: 'Invalid source LP UUID' }),
  newLpId: z.string().uuid({ message: 'Invalid new LP UUID' }),
  quantity: z.number().positive({ message: 'Quantity must be positive' }),
}).refine(data => data.sourceLpId !== data.newLpId, {
  message: 'Source and new LP cannot be the same (self-referencing not allowed)',
  path: ['newLpId'],
})

// =============================================================================
// Link Merge Schema (AC-6)
// =============================================================================

export const linkMergeSchema = z.object({
  sourceLpIds: z.array(z.string().uuid({ message: 'Invalid source LP UUID' })).min(1, { message: 'At least one source LP is required' }),
  targetLpId: z.string().uuid({ message: 'Invalid target LP UUID' }),
}).refine(data => !data.sourceLpIds.includes(data.targetLpId), {
  message: 'Target LP cannot be in source list',
})

// =============================================================================
// Trace Query Schema (AC-8 to AC-14)
// =============================================================================

export const traceQuerySchema = z.object({
  maxDepth: z.coerce.number().int().min(1).max(10).default(10),
  includeReversed: z.coerce.boolean().default(false),
})

// =============================================================================
// Genealogy Direction Schema
// =============================================================================

export const genealogyDirectionSchema = genealogyDirectionEnum.default('both')

// =============================================================================
// Type Exports
// =============================================================================

export type OperationType = z.infer<typeof operationTypeEnum>
export type GenealogyDirection = z.infer<typeof genealogyDirectionEnum>
export type LinkConsumptionInput = z.infer<typeof linkConsumptionSchema>
export type LinkOutputInput = z.infer<typeof linkOutputSchema>
export type LinkSplitInput = z.infer<typeof linkSplitSchema>
export type LinkMergeInput = z.infer<typeof linkMergeSchema>
export type TraceQueryParams = z.infer<typeof traceQuerySchema>

// =============================================================================
// Uppercase Exports (for compatibility with tests)
// =============================================================================

export const OperationTypeEnum = operationTypeEnum
export const LinkConsumptionSchema = linkConsumptionSchema
export const LinkOutputSchema = linkOutputSchema
export const LinkSplitSchema = linkSplitSchema
export const LinkMergeSchema = linkMergeSchema
export const TraceQuerySchema = traceQuerySchema
export const GenealogyDirectionSchema = genealogyDirectionSchema
