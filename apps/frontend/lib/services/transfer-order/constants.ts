/**
 * Transfer Order Service Constants
 * Story 03.8 - Refactor
 *
 * Extracted constants for error codes, allowed roles, and editable statuses
 */

// ============================================================================
// ERROR CODES
// ============================================================================

export const ErrorCode = {
  DUPLICATE_TO_NUMBER: 'DUPLICATE_TO_NUMBER',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  FOREIGN_KEY_CONSTRAINT: 'FOREIGN_KEY_CONSTRAINT',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode]

// ============================================================================
// ROLES & PERMISSIONS
// ============================================================================

export const ALLOWED_ROLES: string[] = ['warehouse', 'purchasing', 'technical', 'admin']

export const EDITABLE_STATUSES: string[] = ['draft', 'planned']

export const DRAFT_ONLY_STATUSES: string[] = ['draft']

export const SHIPPABLE_STATUSES: string[] = ['draft', 'planned', 'partially_shipped', 'shipped']

export const NON_SHIPPABLE_STATUSES: string[] = ['cancelled', 'received']

// ============================================================================
// TO NUMBER FORMAT
// ============================================================================

export const TO_NUMBER_PREFIX = 'TO-'
export const TO_NUMBER_PADDING = 3 // Pad to 3 digits (001, 002, etc.)

// ============================================================================
// STATUS CALCULATION
// ============================================================================

export const TransferOrderStatus = {
  DRAFT: 'draft',
  PLANNED: 'planned',
  PARTIALLY_SHIPPED: 'partially_shipped',
  SHIPPED: 'shipped',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
} as const
