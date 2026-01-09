/**
 * Material Availability Validation - Story 03.13
 *
 * Zod schemas for WO material availability validation:
 * - availabilityStatusEnum: Status values (sufficient/low_stock/shortage/no_stock)
 * - materialAvailabilitySchema: Single material availability data
 * - availabilitySummarySchema: Summary counts by status
 * - availabilityResponseSchema: Full API response structure
 *
 * @module lib/validation/material-availability
 */

import { z } from 'zod'

// ============================================================================
// Status Enum
// ============================================================================

/**
 * Availability status enum
 * - sufficient: coverage >= 100%
 * - low_stock: 50% <= coverage < 100%
 * - shortage: 0% < coverage < 50%
 * - no_stock: coverage = 0%
 */
export const availabilityStatusEnum = z.enum([
  'sufficient',
  'low_stock',
  'shortage',
  'no_stock',
])

export type AvailabilityStatus = z.infer<typeof availabilityStatusEnum>

// ============================================================================
// Material Availability Schema
// ============================================================================

/**
 * Single material availability data
 */
export const materialAvailabilitySchema = z.object({
  wo_material_id: z.string().uuid(),
  product_id: z.string().uuid(),
  product_code: z.string(),
  product_name: z.string(),
  required_qty: z.number().nonnegative(),
  available_qty: z.number().nonnegative(),
  reserved_qty: z.number().nonnegative(),
  shortage_qty: z.number(), // Can be negative (surplus)
  coverage_percent: z.number().min(0),
  status: availabilityStatusEnum,
  uom: z.string(),
  expired_excluded_qty: z.number().nonnegative(),
})

export type MaterialAvailability = z.infer<typeof materialAvailabilitySchema>

// ============================================================================
// Summary Schema
// ============================================================================

/**
 * Summary statistics by status
 */
export const availabilitySummarySchema = z.object({
  total_materials: z.number().int().nonnegative(),
  sufficient_count: z.number().int().nonnegative(),
  low_stock_count: z.number().int().nonnegative(),
  shortage_count: z.number().int().nonnegative(),
})

export type AvailabilitySummary = z.infer<typeof availabilitySummarySchema>

// ============================================================================
// API Response Schema
// ============================================================================

/**
 * Full availability response from API
 */
export const availabilityResponseSchema = z.object({
  wo_id: z.string().uuid(),
  checked_at: z.string().datetime(),
  overall_status: availabilityStatusEnum,
  materials: z.array(materialAvailabilitySchema),
  summary: availabilitySummarySchema,
  enabled: z.boolean(),
  cached: z.boolean(),
  cache_expires_at: z.string().datetime().optional(),
})

export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>

// ============================================================================
// Disabled Response Schema
// ============================================================================

/**
 * Response when availability check is disabled via settings
 */
export const availabilityDisabledResponseSchema = z.object({
  wo_id: z.string().uuid(),
  enabled: z.literal(false),
  message: z.string().optional(),
})

export type AvailabilityDisabledResponse = z.infer<typeof availabilityDisabledResponseSchema>

// ============================================================================
// Error Codes
// ============================================================================

export const AVAILABILITY_ERROR_CODES = {
  WO_NOT_FOUND: 'WO_NOT_FOUND',
  INVALID_ID: 'INVALID_ID',
  FORBIDDEN: 'FORBIDDEN',
  DISABLED: 'DISABLED',
} as const

export type AvailabilityErrorCode = keyof typeof AVAILABILITY_ERROR_CODES
