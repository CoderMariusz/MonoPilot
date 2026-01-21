/**
 * Scanner Putaway Validation Schemas (Story 05.21)
 * Purpose: Zod validation schemas for scanner putaway operations
 * Phase: GREEN - Schema definitions for implementation
 */

import { z } from 'zod'

// =============================================================================
// Scanner Putaway Request Schema
// =============================================================================

export const scannerPutawaySchema = z.object({
  lp_id: z.string({ required_error: 'LP ID is required' }).uuid('Invalid LP ID'),
  location_id: z.string({ required_error: 'Location ID is required' }).uuid('Invalid location ID'),
  suggested_location_id: z.string().uuid('Invalid suggested location ID').optional().nullable(),
  override: z.boolean().default(false),
  override_reason: z.string().max(500, 'Override reason max 500 characters').optional().nullable(),
})

export type ScannerPutawayInput = z.infer<typeof scannerPutawaySchema>

// =============================================================================
// Putaway Suggest Schema
// =============================================================================

export const putawaySuggestSchema = z.object({
  lp_id: z.string({ required_error: 'LP ID is required' }).uuid('Invalid LP ID'),
})

export type PutawaySuggestInput = z.infer<typeof putawaySuggestSchema>

// =============================================================================
// Validate Putaway Schema
// =============================================================================

export const validatePutawaySchema = z.object({
  lp_id: z.string().uuid('Invalid LP ID'),
  location_id: z.string().uuid('Invalid location ID'),
  suggested_location_id: z.string().uuid('Invalid suggested location ID').optional().nullable(),
})

export type ValidatePutawayInput = z.infer<typeof validatePutawaySchema>

// =============================================================================
// Response Types
// =============================================================================

export interface SuggestedLocation {
  id: string
  location_code: string
  full_path: string
  zone_id: string | null
  zone_name: string | null
  aisle: string | null
  rack: string | null
  level: string | null
}

export interface PutawaySuggestion {
  suggestedLocation: SuggestedLocation | null
  reason: string
  reasonCode: 'fifo_zone' | 'fefo_zone' | 'product_zone' | 'default_zone' | 'no_preference'
  alternatives: Array<{
    id: string
    location_code: string
    reason: string
  }>
  strategyUsed: 'fifo' | 'fefo' | 'none'
  lpDetails: {
    lp_number: string
    product_name: string
    quantity: number
    uom: string
    expiry_date: string | null
    current_location: string
  }
}

export interface PutawayValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
  warnings: Array<{ field: string; message: string }>
}

export interface PutawayResult {
  stockMove: {
    id: string
    move_number: string
    move_type: 'putaway'
    from_location_id: string
    to_location_id: string
    quantity: number
    status: 'completed'
  }
  lp: {
    id: string
    lp_number: string
    location_id: string
    location_path: string
  }
  overrideApplied: boolean
  suggestedLocationCode?: string
}

// =============================================================================
// Error Codes
// =============================================================================

export const SCANNER_PUTAWAY_ERROR_CODES = {
  LP_NOT_FOUND: 'LP_NOT_FOUND',
  LP_NOT_AVAILABLE: 'LP_NOT_AVAILABLE',
  LP_CONSUMED: 'LP_CONSUMED',
  LP_BLOCKED: 'LP_BLOCKED',
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  LOCATION_NOT_ACTIVE: 'LOCATION_NOT_ACTIVE',
  LOCATION_NOT_IN_WAREHOUSE: 'LOCATION_NOT_IN_WAREHOUSE',
  NO_LOCATIONS_AVAILABLE: 'NO_LOCATIONS_AVAILABLE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const

export type ScannerPutawayErrorCode =
  (typeof SCANNER_PUTAWAY_ERROR_CODES)[keyof typeof SCANNER_PUTAWAY_ERROR_CODES]
