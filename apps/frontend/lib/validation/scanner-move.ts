/**
 * Scanner Move Validation Schemas (Story 05.20)
 * Purpose: Zod validation schemas for scanner move operations
 * Phase: RED - Schema definitions for tests
 */

import { z } from 'zod'

// =============================================================================
// Scanner Move Request Schema
// =============================================================================

export const scannerMoveSchema = z.object({
  lp_id: z.string({ required_error: 'LP ID is required' }).uuid('Invalid LP ID'),
  to_location_id: z.string({ required_error: 'Location ID is required' }).uuid('Invalid location ID'),
  notes: z.string().max(500, 'Notes max 500 characters').optional().nullable(),
})

export type ScannerMoveInput = z.infer<typeof scannerMoveSchema>

// =============================================================================
// Validate Move Schema (Pre-validation)
// =============================================================================

export const validateMoveSchema = z.object({
  lp_id: z.string().uuid('Invalid LP ID'),
  to_location_id: z.string().uuid('Invalid location ID'),
})

export type ValidateMoveInput = z.infer<typeof validateMoveSchema>

// =============================================================================
// LP Lookup Schema
// =============================================================================

export const lpLookupSchema = z.object({
  barcode: z.string({ required_error: 'Barcode is required' })
    .min(1, 'Barcode required')
    .max(100, 'Barcode too long'),
})

export type LPLookupInput = z.infer<typeof lpLookupSchema>

// =============================================================================
// Location Lookup Schema
// =============================================================================

export const locationLookupSchema = z.object({
  barcode: z.string({ required_error: 'Barcode is required' })
    .min(1, 'Barcode required')
    .max(100, 'Barcode too long'),
})

export type LocationLookupInput = z.infer<typeof locationLookupSchema>

// =============================================================================
// Response Types
// =============================================================================

export interface MoveValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
  warnings: Array<{ code: string; message: string }>
  lp?: LPLookupResult
  destination?: LocationLookupResult
}

export interface ScannerMoveResult {
  stock_move: {
    id: string
    move_number: string
    move_type: 'transfer'
    from_location_id: string
    to_location_id: string
    quantity: number
    status: 'completed'
    move_date: string
  }
  lp: {
    id: string
    lp_number: string
    location_id: string
    location_path: string
    product_name: string
    quantity: number
    uom: string
  }
}

export interface LPLookupResult {
  id: string
  lp_number: string
  product: {
    id: string
    name: string
    sku: string
  }
  quantity: number
  uom: string
  location: {
    id: string
    code: string
    path: string
  }
  status: 'available' | 'reserved' | 'consumed' | 'blocked'
  qa_status: 'pending' | 'passed' | 'failed' | 'on_hold'
  batch_number: string | null
  expiry_date: string | null
}

export interface LocationLookupResult {
  id: string
  location_code: string
  location_path: string
  warehouse_name: string
  is_active: boolean
  capacity_pct: number | null
}

export interface RecentMoveResult {
  id: string
  lp_number: string
  from_location_code: string
  to_location_code: string
  move_date: string
  relative_time: string
}

// =============================================================================
// Error Codes
// =============================================================================

export const SCANNER_MOVE_ERROR_CODES = {
  LP_NOT_FOUND: 'LP_NOT_FOUND',
  LP_NOT_AVAILABLE: 'LP_NOT_AVAILABLE',
  LP_RESERVED: 'LP_RESERVED',
  LP_BLOCKED: 'LP_BLOCKED',
  LP_CONSUMED: 'LP_CONSUMED',
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  LOCATION_NOT_ACTIVE: 'LOCATION_NOT_ACTIVE',
  SAME_LOCATION: 'SAME_LOCATION',
  CAPACITY_WARNING: 'CAPACITY_WARNING',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const

export type ScannerMoveErrorCode = typeof SCANNER_MOVE_ERROR_CODES[keyof typeof SCANNER_MOVE_ERROR_CODES]
