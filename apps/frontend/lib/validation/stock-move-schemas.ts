/**
 * Stock Move Validation Schemas (Story 05.16)
 * Purpose: Zod validation schemas for stock move CRUD operations
 *
 * Provides schemas for:
 * - createStockMoveSchema: Create stock move (transfer, adjustment, etc.)
 * - cancelStockMoveSchema: Cancel existing stock move
 * - listStockMovesSchema: Query params for listing moves
 * - moveTypeEnum: Move type enum values
 * - reasonCodeEnum: Reason code enum values
 */

import { z } from 'zod'

// ============================================================================
// Move Type Enum
// ============================================================================

/**
 * Valid move type values
 * - transfer: LP moves from location A to location B
 * - issue: LP leaves warehouse (to production, shipping)
 * - receipt: LP enters warehouse (from GRN)
 * - adjustment: Quantity adjustment, no location change
 * - return: LP returned from production/shipping
 * - quarantine: LP moved to quarantine location
 * - putaway: Guided putaway from receiving to storage
 */
export const MOVE_TYPES = [
  'transfer',
  'issue',
  'receipt',
  'adjustment',
  'return',
  'quarantine',
  'putaway',
] as const

export type MoveType = (typeof MOVE_TYPES)[number]

export const moveTypeEnum = z.enum(MOVE_TYPES, {
  errorMap: () => ({
    message: `Move type must be one of: ${MOVE_TYPES.join(', ')}`,
  }),
})

// ============================================================================
// Reason Code Enum (for adjustments)
// ============================================================================

/**
 * Valid reason codes for adjustments
 * - damage: Physical damage
 * - theft: Suspected theft
 * - counting_error: Inventory count discrepancy
 * - quality_issue: Quality control failure
 * - expired: Product expired
 * - other: Other reason (requires notes)
 */
export const REASON_CODES = [
  'damage',
  'theft',
  'counting_error',
  'quality_issue',
  'expired',
  'other',
] as const

export type ReasonCode = (typeof REASON_CODES)[number]

export const reasonCodeEnum = z.enum(REASON_CODES, {
  errorMap: () => ({
    message: `Reason code must be one of: ${REASON_CODES.join(', ')}`,
  }),
})

// ============================================================================
// Move Status Enum
// ============================================================================

export const MOVE_STATUSES = ['completed', 'cancelled'] as const

export type MoveStatus = (typeof MOVE_STATUSES)[number]

export const moveStatusEnum = z.enum(MOVE_STATUSES, {
  errorMap: () => ({
    message: `Status must be one of: ${MOVE_STATUSES.join(', ')}`,
  }),
})

// ============================================================================
// Reference Type Enum
// ============================================================================

export const REFERENCE_TYPES = ['grn', 'to', 'wo', 'adjustment', 'manual'] as const

export type ReferenceType = (typeof REFERENCE_TYPES)[number]

export const referenceTypeEnum = z.enum(REFERENCE_TYPES, {
  errorMap: () => ({
    message: `Reference type must be one of: ${REFERENCE_TYPES.join(', ')}`,
  }),
})

// ============================================================================
// Create Stock Move Schema
// ============================================================================

/**
 * Schema for creating a stock move
 *
 * Fields:
 * - lpId: Required - UUID - License plate to move
 * - moveType: Required - One of move types
 * - toLocationId: Conditional - Required for transfer/putaway/quarantine/return
 * - quantity: Optional - Defaults to full LP qty
 * - reason: Optional - Text explanation
 * - reasonCode: Conditional - Required for adjustments
 * - woId: Optional - Work order reference
 * - referenceId: Optional - Generic reference ID
 * - referenceType: Optional - Reference type
 */
export const createStockMoveSchema = z
  .object({
    lpId: z.string().uuid('Invalid LP ID format'),
    moveType: moveTypeEnum,
    toLocationId: z.string().uuid('Invalid location ID format').optional().nullable(),
    quantity: z
      .number()
      .optional()
      .nullable(),
    reason: z
      .string()
      .max(500, 'Reason cannot exceed 500 characters')
      .optional()
      .nullable(),
    reasonCode: reasonCodeEnum.optional().nullable(),
    woId: z.string().uuid('Invalid WO ID format').optional().nullable(),
    referenceId: z.string().uuid('Invalid reference ID format').optional().nullable(),
    referenceType: referenceTypeEnum.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Require destination for transfer types
    if (
      ['transfer', 'putaway', 'quarantine', 'return'].includes(data.moveType) &&
      !data.toLocationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Destination location required for this move type',
        path: ['toLocationId'],
      })
    }

    // Require reason code for adjustments
    if (data.moveType === 'adjustment' && !data.reasonCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Reason code required for adjustments',
        path: ['reasonCode'],
      })
    }
  })

export type CreateStockMoveInput = z.infer<typeof createStockMoveSchema>

// ============================================================================
// Cancel Stock Move Schema
// ============================================================================

/**
 * Schema for cancelling a stock move
 *
 * Fields:
 * - reason: Required - Min 10 chars - Cancellation reason
 */
export const cancelStockMoveSchema = z.object({
  reason: z
    .string()
    .min(10, 'Cancellation reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
})

export type CancelStockMoveInput = z.infer<typeof cancelStockMoveSchema>

// ============================================================================
// List Stock Moves Schema (Query Params)
// ============================================================================

/**
 * Schema for listing stock moves with filters
 *
 * Fields:
 * - page: Optional - Page number (default 1)
 * - limit: Optional - Items per page (default 50, max 200)
 * - moveType: Optional - Filter by move type
 * - lpId: Optional - Filter by LP
 * - locationId: Optional - Filter by from or to location
 * - dateFrom: Optional - Filter by date range start
 * - dateTo: Optional - Filter by date range end
 * - status: Optional - Filter by status
 * - search: Optional - Search by move number
 */
export const listStockMovesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
  moveType: moveTypeEnum.optional(),
  lpId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: moveStatusEnum.optional(),
  search: z.string().optional(),
})

export type ListStockMovesInput = z.infer<typeof listStockMovesSchema>

// ============================================================================
// Stock Move Response Types
// ============================================================================

export interface StockMove {
  id: string
  orgId: string
  moveNumber: string
  lpId: string
  moveType: MoveType
  fromLocationId: string | null
  toLocationId: string | null
  quantity: number
  status: MoveStatus
  moveDate: string
  reason: string | null
  reasonCode: ReasonCode | null
  woId: string | null
  referenceId: string | null
  referenceType: ReferenceType | null
  createdAt: string
  createdBy: string | null
  cancelledAt: string | null
  cancelledBy: string | null
  notes: string | null
}

export interface StockMoveWithRelations extends StockMove {
  licensePlate?: {
    lpNumber: string
    product?: {
      name: string
      sku: string
    }
  }
  fromLocation?: {
    locationCode: string
    name: string
  }
  toLocation?: {
    locationCode: string
    name: string
  }
  createdByUser?: {
    name: string
    email: string
  }
  cancelledByUser?: {
    name: string
    email: string
  }
}

export interface PaginatedStockMoves {
  data: StockMoveWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
