/**
 * LP Reservation Service (Story 05.3)
 * Purpose: Manage LP reservations for Work Orders and Transfer Orders
 *
 * CRITICAL for Epic 04.8 (Material Reservations):
 * - createReservation(): Create LP reservation
 * - releaseReservation(): Release single reservation
 * - releaseAllReservations(): Release all WO reservations
 * - getReservations(): Get reservations for WO
 * - consumeReservation(): Mark reservation as consumed
 * - getAvailableQuantity(): Calculate available qty for LP
 * - reserveLPs(): Multi-LP allocation (uses FIFOFEFOService)
 *
 * Architecture: Service accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 *
 * Security: All queries enforce org_id isolation (ADR-013). RLS enabled.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createReservationSchema,
  updateReservationSchema,
  type CreateReservationInput,
  type UpdateReservationInput,
  type ReservationResult,
  type AllocationResult,
  type ReservationWithLP,
} from '@/lib/validation/reservation-schemas'
import { findAvailableLPs } from './fifo-fefo-service'

// =============================================================================
// Error Types
// =============================================================================

export class ReservationError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'ReservationError'
  }
}

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * Create a reservation for an LP
 * Validates: LP availability, status, QA status, quantity
 *
 * @param supabase - Supabase client
 * @param input - Reservation input (lp_id, wo_id/to_id, reserved_qty)
 * @returns Created reservation
 * @throws ReservationError if validation fails
 */
export async function createReservation(
  supabase: SupabaseClient,
  input: CreateReservationInput
): Promise<ReservationResult> {
  // Validate input
  const parsed = createReservationSchema.safeParse(input)
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => e.message).join(', ')
    throw new ReservationError(errors, 'VALIDATION_ERROR')
  }

  const { lp_id, wo_id, to_id, wo_material_id, reserved_qty } = parsed.data

  // Get LP and validate
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .select('id, quantity, status, qa_status, org_id')
    .eq('id', lp_id)
    .single()

  if (lpError || !lp) {
    throw new ReservationError('LP not found', 'LP_NOT_FOUND')
  }

  // Validate LP status
  if (lp.status !== 'available' && lp.status !== 'reserved') {
    throw new ReservationError(
      `LP not available for reservation (status: ${lp.status})`,
      'LP_UNAVAILABLE'
    )
  }

  // Validate QA status
  if (lp.qa_status !== 'passed') {
    throw new ReservationError(
      `QA status must be passed (current: ${lp.qa_status})`,
      'QA_NOT_PASSED'
    )
  }

  // Calculate available quantity
  const availableQty = await getAvailableQuantity(supabase, lp_id)

  if (reserved_qty > availableQty) {
    throw new ReservationError(
      `Insufficient available quantity (requested: ${reserved_qty}, available: ${availableQty})`,
      'INSUFFICIENT_QTY'
    )
  }

  // Get current user
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  // Create reservation
  const { data: reservation, error: insertError } = await supabase
    .from('lp_reservations')
    .insert({
      org_id: lp.org_id,
      lp_id,
      wo_id: wo_id || null,
      to_id: to_id || null,
      wo_material_id: wo_material_id || null,
      reserved_qty,
      consumed_qty: 0,
      status: 'active',
      reserved_by: userId,
    })
    .select()
    .single()

  if (insertError) {
    throw new ReservationError(
      `Failed to create reservation: ${insertError.message}`,
      'INSERT_ERROR'
    )
  }

  return reservation as ReservationResult
}

/**
 * Get a single reservation by ID
 */
export async function getReservation(
  supabase: SupabaseClient,
  id: string
): Promise<ReservationResult | null> {
  const { data, error } = await supabase
    .from('lp_reservations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new ReservationError(`Failed to fetch reservation: ${error.message}`, 'FETCH_ERROR')
  }

  return data as ReservationResult
}

/**
 * Get all reservations for a Work Order with LP details
 */
export async function getReservations(
  supabase: SupabaseClient,
  woId: string
): Promise<ReservationWithLP[]> {
  const { data, error } = await supabase
    .from('lp_reservations')
    .select(`
      *,
      license_plates!inner (
        lp_number,
        product_id,
        batch_number,
        expiry_date,
        location_id,
        warehouse_id,
        products!inner (
          name
        ),
        locations!inner (
          full_path
        ),
        warehouses!inner (
          name
        )
      )
    `)
    .eq('wo_id', woId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new ReservationError(`Failed to fetch reservations: ${error.message}`, 'FETCH_ERROR')
  }

  if (!data) {
    return []
  }

  // Transform to ReservationWithLP format
  return data.map((r: Record<string, unknown>) => {
    const lp = r.license_plates as Record<string, unknown>
    const product = lp?.products as { name: string }
    const location = lp?.locations as { full_path: string }
    const warehouse = lp?.warehouses as { name: string }

    return {
      id: r.id as string,
      lp_id: r.lp_id as string,
      wo_id: r.wo_id as string | null,
      to_id: r.to_id as string | null,
      wo_material_id: r.wo_material_id as string | null,
      reserved_qty: Number(r.reserved_qty),
      consumed_qty: Number(r.consumed_qty),
      status: r.status as 'active' | 'released' | 'consumed',
      reserved_at: r.reserved_at as string,
      released_at: r.released_at as string | null,
      reserved_by: r.reserved_by as string,
      created_at: r.created_at as string,
      lp: {
        lp_number: lp?.lp_number as string,
        product_id: lp?.product_id as string,
        product_name: product?.name || '',
        batch_number: lp?.batch_number as string | null,
        expiry_date: lp?.expiry_date as string | null,
        location_id: lp?.location_id as string,
        location_path: location?.full_path || '',
        warehouse_id: lp?.warehouse_id as string,
        warehouse_name: warehouse?.name || '',
      },
      remaining_qty: Number(r.reserved_qty) - Number(r.consumed_qty),
    }
  })
}

/**
 * Update a reservation
 */
export async function updateReservation(
  supabase: SupabaseClient,
  id: string,
  input: UpdateReservationInput
): Promise<ReservationResult> {
  // Validate input
  const parsed = updateReservationSchema.safeParse(input)
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => e.message).join(', ')
    throw new ReservationError(errors, 'VALIDATION_ERROR')
  }

  // Get existing reservation
  const existing = await getReservation(supabase, id)
  if (!existing) {
    throw new ReservationError('Reservation not found', 'NOT_FOUND')
  }

  // If updating reserved_qty, validate against available
  if (parsed.data.reserved_qty) {
    const lp = await supabase
      .from('license_plates')
      .select('id, quantity')
      .eq('id', existing.lp_id)
      .single()

    if (lp.error) {
      throw new ReservationError('LP not found', 'LP_NOT_FOUND')
    }

    const availableQty = await getAvailableQuantity(supabase, existing.lp_id)
    // Add back current reservation qty since we're updating
    const adjustedAvailable = availableQty + existing.reserved_qty

    if (parsed.data.reserved_qty > adjustedAvailable) {
      throw new ReservationError(
        `Insufficient available quantity (requested: ${parsed.data.reserved_qty}, available: ${adjustedAvailable})`,
        'INSUFFICIENT_QTY'
      )
    }
  }

  const { data, error } = await supabase
    .from('lp_reservations')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new ReservationError(`Failed to update reservation: ${error.message}`, 'UPDATE_ERROR')
  }

  return data as ReservationResult
}

/**
 * Release a reservation (set status to 'released')
 */
export async function releaseReservation(
  supabase: SupabaseClient,
  id: string
): Promise<ReservationResult> {
  const { data, error } = await supabase
    .from('lp_reservations')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ReservationError('Reservation not found', 'NOT_FOUND')
    }
    throw new ReservationError(`Failed to release reservation: ${error.message}`, 'UPDATE_ERROR')
  }

  return data as ReservationResult
}

/**
 * Release all active reservations for a Work Order
 * @returns Number of reservations released
 */
export async function releaseAllReservations(
  supabase: SupabaseClient,
  woId: string
): Promise<number> {
  // First get count of active reservations
  const { data: existing } = await supabase
    .from('lp_reservations')
    .select('id')
    .eq('wo_id', woId)
    .eq('status', 'active')

  if (!existing || existing.length === 0) {
    return 0
  }

  // Update all to released
  const { error } = await supabase
    .from('lp_reservations')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
    })
    .eq('wo_id', woId)
    .eq('status', 'active')

  if (error) {
    throw new ReservationError(`Failed to release reservations: ${error.message}`, 'UPDATE_ERROR')
  }

  return existing.length
}

/**
 * Consume (partially or fully) from a reservation
 * Updates consumed_qty and sets status to 'consumed' if fully consumed
 */
export async function consumeReservation(
  supabase: SupabaseClient,
  id: string,
  consumedQty: number
): Promise<ReservationResult> {
  // Get existing reservation
  const existing = await getReservation(supabase, id)
  if (!existing) {
    throw new ReservationError('Reservation not found', 'NOT_FOUND')
  }

  // Validate consumed qty
  const newConsumed = existing.consumed_qty + consumedQty
  if (newConsumed > existing.reserved_qty) {
    throw new ReservationError(
      `Cannot consume more than reserved (reserved: ${existing.reserved_qty}, consumed: ${existing.consumed_qty}, requested: ${consumedQty})`,
      'OVERCONSUME'
    )
  }

  // Determine new status
  const newStatus = newConsumed >= existing.reserved_qty ? 'consumed' : 'active'

  const { data, error } = await supabase
    .from('lp_reservations')
    .update({
      consumed_qty: newConsumed,
      status: newStatus,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new ReservationError(`Failed to consume reservation: ${error.message}`, 'UPDATE_ERROR')
  }

  return data as ReservationResult
}

// =============================================================================
// Utility Methods
// =============================================================================

/**
 * Get available quantity for an LP (quantity - active reserved)
 */
export async function getAvailableQuantity(
  supabase: SupabaseClient,
  lpId: string
): Promise<number> {
  // Get LP quantity
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .select('quantity')
    .eq('id', lpId)
    .single()

  if (lpError || !lp) {
    throw new ReservationError('LP not found', 'LP_NOT_FOUND')
  }

  // Get sum of active reservations
  const { data: reservations, error: resError } = await supabase
    .from('lp_reservations')
    .select('reserved_qty, consumed_qty')
    .eq('lp_id', lpId)
    .eq('status', 'active')

  if (resError) {
    throw new ReservationError(
      `Failed to fetch reservations: ${resError.message}`,
      'FETCH_ERROR'
    )
  }

  const totalReserved = (reservations || []).reduce(
    (sum, r) => sum + Number(r.reserved_qty) - Number(r.consumed_qty),
    0
  )

  return Number(lp.quantity) - totalReserved
}

// =============================================================================
// Multi-LP Allocation (Interface for Epic 04.8)
// =============================================================================

/**
 * Reserve LPs for a Work Order material requirement
 * Uses FIFO/FEFO strategy to select optimal LPs
 * Allocates from multiple LPs when single LP insufficient
 *
 * @param supabase - Supabase client
 * @param woId - Work Order ID
 * @param materialId - WO Material ID
 * @param productId - Product to reserve
 * @param requiredQty - Quantity needed
 * @param warehouseId - Optional warehouse filter
 * @returns AllocationResult with reservations and shortfall info
 */
export async function reserveLPs(
  supabase: SupabaseClient,
  woId: string,
  materialId: string,
  productId: string,
  requiredQty: number,
  warehouseId?: string
): Promise<AllocationResult> {
  // Find available LPs using FIFO/FEFO strategy
  const availableLPs = await findAvailableLPs(supabase, productId, {
    warehouseId,
    strategy: 'none', // Will use settings default
  })

  if (availableLPs.length === 0) {
    return {
      success: true,
      reservations: [],
      total_reserved: 0,
      shortfall: requiredQty,
      warning: 'No inventory available',
    }
  }

  // Allocate from LPs in order
  const reservations: ReservationResult[] = []
  let remaining = requiredQty

  for (const lp of availableLPs) {
    if (remaining <= 0) break

    const reserveQty = Math.min(remaining, lp.available_qty)

    try {
      const reservation = await createReservation(supabase, {
        lp_id: lp.id,
        wo_id: woId,
        wo_material_id: materialId,
        reserved_qty: reserveQty,
      })

      reservations.push(reservation)
      remaining -= reserveQty
    } catch {
      // Skip LPs that fail validation (concurrent reservation, etc.)
      continue
    }
  }

  const totalReserved = reservations.reduce((sum, r) => sum + r.reserved_qty, 0)
  const shortfall = requiredQty - totalReserved

  return {
    success: true,
    reservations,
    total_reserved: totalReserved,
    shortfall,
    warning: shortfall > 0 ? `Partial allocation: ${shortfall} units short` : undefined,
  }
}

// =============================================================================
// Export as LPReservationService
// =============================================================================

export const LPReservationService = {
  createReservation,
  getReservation,
  getReservations,
  updateReservation,
  releaseReservation,
  releaseAllReservations,
  consumeReservation,
  getAvailableQuantity,
  reserveLPs,
}
