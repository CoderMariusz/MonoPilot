/**
 * LP Reservation Validation Schemas
 * Story: 05.3 - LP Reservations + FIFO/FEFO Picking
 *
 * Zod schemas for:
 * - Reservation creation/update
 * - Multi-LP allocation
 * - FIFO/FEFO picking
 */

import { z } from 'zod'

// =============================================================================
// Types
// =============================================================================

export type ReservationStatus = 'active' | 'released' | 'consumed'
export type PickingStrategy = 'fifo' | 'fefo' | 'none'

// =============================================================================
// Reservation Schemas
// =============================================================================

/**
 * Create reservation input schema
 * Requires either wo_id or to_id
 */
export const createReservationSchema = z
  .object({
    lp_id: z.string().uuid('Invalid LP ID'),
    wo_id: z.string().uuid('Invalid WO ID').optional(),
    to_id: z.string().uuid('Invalid TO ID').optional(),
    wo_material_id: z.string().uuid('Invalid WO Material ID').optional(),
    reserved_qty: z.number().positive('Reserved quantity must be positive'),
  })
  .refine((data) => data.wo_id || data.to_id, {
    message: 'Either wo_id or to_id must be provided',
    path: ['wo_id'],
  })

export type CreateReservationInput = z.infer<typeof createReservationSchema>

/**
 * Update reservation input schema
 */
export const updateReservationSchema = z.object({
  reserved_qty: z.number().positive('Reserved quantity must be positive').optional(),
  status: z.enum(['active', 'released', 'consumed']).optional(),
})

export type UpdateReservationInput = z.infer<typeof updateReservationSchema>

/**
 * Consume reservation input schema
 */
export const consumeReservationSchema = z.object({
  consumed_qty: z.number().positive('Consumed quantity must be positive'),
})

export type ConsumeReservationInput = z.infer<typeof consumeReservationSchema>

// =============================================================================
// Multi-LP Allocation Schemas
// =============================================================================

/**
 * Reserve multiple LPs for a material requirement
 */
export const reserveLPsSchema = z.object({
  wo_id: z.string().uuid('Invalid WO ID'),
  material_id: z.string().uuid('Invalid Material ID'),
  product_id: z.string().uuid('Invalid Product ID'),
  required_qty: z.number().positive('Required quantity must be positive'),
  warehouse_id: z.string().uuid('Invalid Warehouse ID').optional(),
})

export type ReserveLPsInput = z.infer<typeof reserveLPsSchema>

// =============================================================================
// FIFO/FEFO Picking Schemas
// =============================================================================

/**
 * Find available LPs input schema
 */
export const findAvailableLPsSchema = z.object({
  product_id: z.string().uuid('Invalid Product ID'),
  warehouse_id: z.string().uuid('Invalid Warehouse ID').optional(),
  location_id: z.string().uuid('Invalid Location ID').optional(),
  strategy: z.enum(['fifo', 'fefo', 'none']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

export type FindAvailableLPsInput = z.infer<typeof findAvailableLPsSchema>

/**
 * Check FIFO/FEFO violation input
 */
export const checkViolationSchema = z.object({
  selected_lp_id: z.string().uuid('Invalid LP ID'),
  product_id: z.string().uuid('Invalid Product ID'),
  strategy: z.enum(['fifo', 'fefo']),
})

export type CheckViolationInput = z.infer<typeof checkViolationSchema>

// =============================================================================
// Response Types (not Zod schemas - for TypeScript only)
// =============================================================================

export interface ReservationResult {
  id: string
  lp_id: string
  wo_id: string | null
  to_id: string | null
  wo_material_id: string | null
  reserved_qty: number
  consumed_qty: number
  status: ReservationStatus
  reserved_at: string
  released_at: string | null
  reserved_by: string
  created_at: string
}

export interface AllocationResult {
  success: boolean
  reservations: ReservationResult[]
  total_reserved: number
  shortfall: number
  warning?: string
}

export interface ReservationWithLP extends ReservationResult {
  lp: {
    lp_number: string
    product_id: string
    product_name: string
    batch_number: string | null
    expiry_date: string | null
    location_id: string
    location_path: string
    warehouse_id: string
    warehouse_name: string
  }
  remaining_qty: number
}

export interface AvailableLP {
  id: string
  lp_number: string
  product_id: string
  quantity: number
  available_qty: number
  uom: string
  location_id: string
  warehouse_id: string
  batch_number: string | null
  expiry_date: string | null
  created_at: string
  qa_status: string
  status: string
  suggested?: boolean
  suggestion_reason?: string
}

export interface ViolationResult {
  hasViolation: boolean
  violationType?: 'fifo' | 'fefo'
  message?: string
  suggestedLP?: AvailableLP
  selectedLP?: AvailableLP
}
