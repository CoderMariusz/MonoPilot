/**
 * WO Material Reservations - Zod Validation Schemas (Story 03.11b)
 * Purpose: Validation schemas for WO material reservation API endpoints
 * Phase: RED - Schemas defined for tests, implementation not done yet
 *
 * Schemas for:
 * - CreateReservationSchema: POST /api/planning/work-orders/:id/materials/:materialId/reservations
 * - AvailableLPsQuerySchema: GET /api/planning/work-orders/:id/materials/:materialId/available-lps
 * - ReservationResponseSchema: Response types for reservation endpoints
 * - ReserveAllResponseSchema: Response for POST /api/planning/work-orders/:id/reserve-all
 */

import { z } from 'zod'

// =============================================================================
// Request Schemas
// =============================================================================

/**
 * Schema for creating a manual LP reservation
 * POST /api/planning/work-orders/:id/materials/:materialId/reservations
 */
export const CreateReservationSchema = z.object({
  lp_id: z.string().uuid('LP ID must be a valid UUID'),
  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .refine(
      (val) => {
        const decimals = (val.toString().split('.')[1] || '').length
        return decimals <= 6
      },
      { message: 'Maximum 6 decimal places allowed' }
    ),
})

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>

/**
 * Schema for query parameters when fetching available LPs
 * GET /api/planning/work-orders/:id/materials/:materialId/available-lps
 */
export const AvailableLPsQuerySchema = z.object({
  sort: z.enum(['fifo', 'fefo']).optional(),
  lot_number: z.string().max(50, 'Lot number must be 50 characters or less').optional(),
  location: z.string().max(100, 'Location must be 100 characters or less').optional(),
})

export type AvailableLPsQuery = z.infer<typeof AvailableLPsQuerySchema>

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Schema for a single reservation record with LP details
 */
export const ReservationResponseSchema = z.object({
  id: z.string().uuid(),
  wo_material_id: z.string().uuid(),
  lp_id: z.string().uuid(),
  reserved_qty: z.number().positive(),
  status: z.enum(['active', 'released', 'consumed']),
  reserved_at: z.string().datetime(),
  released_at: z.string().datetime().nullable().optional(),
  consumed_at: z.string().datetime().nullable().optional(),
  lp_number: z.string(),
  location_name: z.string().nullable(),
  expiry_date: z.string().nullable(),
  reserved_by: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .optional(),
})

export type ReservationResponse = z.infer<typeof ReservationResponseSchema>

/**
 * Schema for reservations list response
 * GET /api/planning/work-orders/:id/materials/:materialId/reservations
 */
export const ReservationsListResponseSchema = z.object({
  reservations: z.array(ReservationResponseSchema),
  total_reserved: z.number().nonnegative(),
  required_qty: z.number().nonnegative(),
  coverage_percent: z.number().nonnegative(),
})

export type ReservationsListResponse = z.infer<typeof ReservationsListResponseSchema>

/**
 * Schema for reserve-all response
 * POST /api/planning/work-orders/:id/reserve-all
 */
export const ReserveAllResponseSchema = z.object({
  success: z.boolean(),
  materials_processed: z.number().int().nonnegative(),
  fully_reserved: z.number().int().nonnegative(),
  partially_reserved: z.number().int().nonnegative(),
  shortages: z.array(
    z.object({
      material_name: z.string(),
      required_qty: z.number(),
      reserved_qty: z.number(),
      shortage: z.number(),
    })
  ),
})

export type ReserveAllResponse = z.infer<typeof ReserveAllResponseSchema>

/**
 * Schema for available LP in selection list
 */
export const AvailableLPSchema = z.object({
  id: z.string().uuid(),
  lp_number: z.string(),
  quantity: z.number().nonnegative(),
  available_qty: z.number().nonnegative(), // quantity minus existing reservations
  location: z.string().nullable(),
  expiry_date: z.string().nullable(),
  created_at: z.string().datetime(),
  lot_number: z.string().nullable().optional(),
  uom: z.string().optional(),
  other_reservations: z
    .array(
      z.object({
        wo_number: z.string(),
        quantity: z.number(),
      })
    )
    .optional(),
})

export type AvailableLP = z.infer<typeof AvailableLPSchema>

/**
 * Schema for available LPs response
 * GET /api/planning/work-orders/:id/materials/:materialId/available-lps
 */
export const AvailableLPsResponseSchema = z.object({
  lps: z.array(AvailableLPSchema),
  total_available: z.number().nonnegative(),
})

export type AvailableLPsResponse = z.infer<typeof AvailableLPsResponseSchema>

/**
 * Schema for release reservation response
 * DELETE /api/planning/work-orders/:id/reservations/:reservationId
 */
export const ReleaseReservationResponseSchema = z.object({
  success: z.boolean(),
  released_qty: z.number().nonnegative(),
  message: z.string(),
})

export type ReleaseReservationResponse = z.infer<typeof ReleaseReservationResponseSchema>

// =============================================================================
// Coverage Types
// =============================================================================

/**
 * Reservation coverage status
 */
export type CoverageStatus = 'full' | 'partial' | 'none' | 'over'

/**
 * Coverage calculation result
 */
export interface CoverageResult {
  percent: number
  shortage: number
  status: CoverageStatus
}
