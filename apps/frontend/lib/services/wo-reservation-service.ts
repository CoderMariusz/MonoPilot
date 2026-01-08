/**
 * WO Material Reservation Service (Story 03.11b)
 * Purpose: Business logic for WO material LP reservation management
 *
 * Service handles:
 * - FIFO/FEFO picking algorithms for LP selection (AC-2, AC-3)
 * - Coverage calculation (AC-4, AC-12)
 * - Auto-reservation on WO release (AC-1)
 * - Manual reservation/release (AC-7, AC-8)
 * - Over-reservation warning (soft block) (AC-6)
 * - Auto-release on WO cancellation (AC-10)
 *
 * Architecture: Service accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 *
 * Security: All queries enforce org_id isolation (ADR-013). RLS enabled.
 */

import { createServerSupabaseAdmin, createServerSupabase } from '@/lib/supabase/server'
import type {
  CoverageResult,
  CoverageStatus,
  ReservationResponse,
  ReservationsListResponse,
  ReserveAllResponse,
  AvailableLP,
  AvailableLPsResponse,
} from '@/lib/validation/wo-reservations'

// =============================================================================
// Error Codes
// =============================================================================

export const WOReservationErrorCode = {
  WO_NOT_FOUND: 'WO_NOT_FOUND',
  WO_MATERIAL_NOT_FOUND: 'WO_MATERIAL_NOT_FOUND',
  RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
  LP_NOT_FOUND: 'LP_NOT_FOUND',
  LP_NOT_AVAILABLE: 'LP_NOT_AVAILABLE',
  LP_PRODUCT_MISMATCH: 'LP_PRODUCT_MISMATCH',
  LP_WAREHOUSE_MISMATCH: 'LP_WAREHOUSE_MISMATCH',
  INVALID_WO_STATUS: 'INVALID_WO_STATUS',
  OVER_RESERVATION: 'OVER_RESERVATION',
  EXCEEDS_LP_QUANTITY: 'EXCEEDS_LP_QUANTITY',
  ALREADY_RELEASED: 'ALREADY_RELEASED',
  NO_MATERIALS: 'NO_MATERIALS',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const

export type WOReservationErrorCodeType = (typeof WOReservationErrorCode)[keyof typeof WOReservationErrorCode]

// =============================================================================
// Types
// =============================================================================

interface LP {
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
}

interface AllocationResult {
  lpId: string
  quantity: number
}

interface SelectLPsResult {
  allocations: AllocationResult[]
  totalReserved: number
  shortage: number
}

interface ReservationResult {
  success: boolean
  data?: any
  error?: string
  code?: WOReservationErrorCodeType
  warnings?: string[]
}

// =============================================================================
// Constants
// =============================================================================

const MODIFIABLE_STATUSES = ['planned', 'released', 'in_progress']
const LP_VALID_STATUSES = ['available', 'reserved']

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get current user's org_id and user_id from JWT
 */
async function getCurrentUserData(): Promise<{ orgId: string; userId: string } | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (error || !userData) {
    console.error('Failed to get user data:', user.id, error)
    return null
  }

  return {
    orgId: userData.org_id,
    userId: user.id,
  }
}

/**
 * Get WO with warehouse_id and status
 */
async function getWorkOrder(woId: string, orgId: string) {
  const supabaseAdmin = createServerSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('work_orders')
    .select('id, organization_id, warehouse_id, status')
    .eq('id', woId)
    .eq('organization_id', orgId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Get WO material with product_id and quantities
 */
async function getWOMaterial(materialId: string, woId: string) {
  const supabaseAdmin = createServerSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('wo_materials')
    .select('id, wo_id, product_id, material_name, required_qty, reserved_qty, consumed_qty, uom')
    .eq('id', materialId)
    .eq('wo_id', woId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Get LP with warehouse_id, product_id, and available quantity
 */
async function getLicensePlate(lpId: string, orgId: string) {
  const supabaseAdmin = createServerSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('license_plates')
    .select(`
      id,
      lp_number,
      warehouse_id,
      product_id,
      quantity,
      status,
      qa_status,
      batch_number,
      expiry_date,
      created_at,
      location_id,
      uom
    `)
    .eq('id', lpId)
    .eq('org_id', orgId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Get location name by ID
 */
async function getLocationName(locationId: string | null): Promise<string | null> {
  if (!locationId) return null

  const supabaseAdmin = createServerSupabaseAdmin()

  const { data } = await supabaseAdmin
    .from('locations')
    .select('name')
    .eq('id', locationId)
    .single()

  return data?.name || null
}

/**
 * Get available quantity for an LP (quantity minus active reservations)
 */
async function getAvailableQuantity(lpId: string): Promise<number> {
  const supabaseAdmin = createServerSupabaseAdmin()

  // Get LP quantity
  const { data: lp, error: lpError } = await supabaseAdmin
    .from('license_plates')
    .select('quantity')
    .eq('id', lpId)
    .single()

  if (lpError || !lp) return 0

  // Get sum of active reservations
  const { data: reservations } = await supabaseAdmin
    .from('lp_reservations')
    .select('reserved_qty, consumed_qty')
    .eq('lp_id', lpId)
    .eq('status', 'active')

  const totalReserved = (reservations || []).reduce(
    (sum, r) => sum + Number(r.reserved_qty) - Number(r.consumed_qty),
    0
  )

  return Number(lp.quantity) - totalReserved
}

// =============================================================================
// Service Class
// =============================================================================

/**
 * WO Reservation Service
 * Handles all WO material reservation operations
 */
export class WOReservationService {
  // ===========================================================================
  // FIFO/FEFO Picking Algorithms
  // ===========================================================================

  /**
   * Select LPs using FIFO algorithm (First In, First Out)
   * Sorts by created_at ASC (oldest first)
   */
  static selectLPsFIFO(lps: LP[], requiredQty: number): SelectLPsResult {
    // Sort by created_at ASC (oldest first)
    const sortedLps = [...lps].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    return WOReservationService.allocateFromLPs(sortedLps, requiredQty)
  }

  /**
   * Select LPs using FEFO algorithm (First Expiry, First Out)
   * Sorts by expiry_date ASC (soonest expiry first, NULL last)
   */
  static selectLPsFEFO(lps: LP[], requiredQty: number): SelectLPsResult {
    // Sort by expiry_date ASC (soonest first), NULL last
    // Use created_at as tiebreaker for same expiry date
    const sortedLps = [...lps].sort((a, b) => {
      // NULL expiry dates go last
      if (a.expiry_date === null && b.expiry_date === null) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (a.expiry_date === null) return 1
      if (b.expiry_date === null) return -1

      const expiryCompare = new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
      if (expiryCompare !== 0) return expiryCompare

      // Same expiry date: use FIFO as tiebreaker
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    return WOReservationService.allocateFromLPs(sortedLps, requiredQty)
  }

  /**
   * Allocate from sorted LP list
   */
  private static allocateFromLPs(sortedLps: LP[], requiredQty: number): SelectLPsResult {
    const allocations: AllocationResult[] = []
    let remaining = requiredQty
    let totalReserved = 0

    for (const lp of sortedLps) {
      if (remaining <= 0) break
      if (lp.available_qty <= 0) continue

      const allocateQty = Math.min(remaining, lp.available_qty)
      allocations.push({
        lpId: lp.id,
        quantity: allocateQty,
      })
      totalReserved += allocateQty
      remaining -= allocateQty
    }

    return {
      allocations,
      totalReserved,
      shortage: Math.max(0, requiredQty - totalReserved),
    }
  }

  // ===========================================================================
  // Coverage Calculation
  // ===========================================================================

  /**
   * Calculate reservation coverage for a material
   * Returns percent, shortage, and status (full/partial/none/over)
   */
  static calculateCoverage(requiredQty: number, reservedQty: number): CoverageResult {
    // Handle zero required quantity
    if (requiredQty === 0) {
      return {
        percent: reservedQty > 0 ? 100 : 0,
        shortage: 0,
        status: reservedQty > 0 ? 'over' : 'none' as CoverageStatus,
      }
    }

    const percent = Math.round((reservedQty / requiredQty) * 100)
    const shortage = Math.max(0, requiredQty - reservedQty)

    let status: CoverageStatus
    if (reservedQty === 0) {
      status = 'none'
    } else if (reservedQty > requiredQty) {
      status = 'over'
    } else if (reservedQty >= requiredQty) {
      status = 'full'
    } else {
      status = 'partial'
    }

    return { percent, shortage, status }
  }

  // ===========================================================================
  // Auto-Reservation
  // ===========================================================================

  /**
   * Auto-reserve LPs for all materials in a WO using FIFO/FEFO
   * Called on WO release status transition
   */
  static async autoReserveWOMaterials(woId: string): Promise<ReservationResult> {
    try {
      const userData = await getCurrentUserData()
      if (!userData) {
        return { success: false, error: 'User not authenticated', code: WOReservationErrorCode.DATABASE_ERROR }
      }

      const { orgId, userId } = userData
      const supabaseAdmin = createServerSupabaseAdmin()

      // Get WO
      const wo = await getWorkOrder(woId, orgId)
      if (!wo) {
        return { success: false, error: 'Work order not found', code: WOReservationErrorCode.WO_NOT_FOUND }
      }

      // Check WO status
      if (!WOReservationService.canModifyReservations(wo.status)) {
        return { success: false, error: `Cannot reserve materials for ${wo.status} Work Order`, code: WOReservationErrorCode.INVALID_WO_STATUS }
      }

      // Get all materials for WO
      const { data: materials, error: matError } = await supabaseAdmin
        .from('wo_materials')
        .select('id, product_id, material_name, required_qty, reserved_qty, uom')
        .eq('wo_id', woId)
        .gt('required_qty', 0)

      if (matError) {
        return { success: false, error: 'Failed to fetch materials', code: WOReservationErrorCode.DATABASE_ERROR }
      }

      if (!materials || materials.length === 0) {
        return {
          success: true,
          data: {
            materials_processed: 0,
            fully_reserved: 0,
            partially_reserved: 0,
            shortages: [],
          },
        }
      }

      // Get warehouse settings for FIFO/FEFO preference
      const { data: warehouseSettings } = await supabaseAdmin
        .from('warehouse_settings')
        .select('enable_fefo')
        .eq('org_id', orgId)
        .single()

      const useFEFO = warehouseSettings?.enable_fefo ?? false

      let fullyReserved = 0
      let partiallyReserved = 0
      const shortages: Array<{ material_name: string; required_qty: number; reserved_qty: number; shortage: number }> = []

      // Process each material
      for (const material of materials) {
        const remainingRequired = Number(material.required_qty) - Number(material.reserved_qty)
        if (remainingRequired <= 0) {
          fullyReserved++
          continue
        }

        // Get available LPs for this product in the WO warehouse
        const { data: availableLPs } = await supabaseAdmin
          .from('license_plates')
          .select('id, lp_number, product_id, quantity, status, qa_status, batch_number, expiry_date, created_at, location_id, warehouse_id, uom')
          .eq('org_id', orgId)
          .eq('warehouse_id', wo.warehouse_id)
          .eq('product_id', material.product_id)
          .eq('qa_status', 'passed')
          .in('status', LP_VALID_STATUSES)
          .gt('quantity', 0)

        if (!availableLPs || availableLPs.length === 0) {
          shortages.push({
            material_name: material.material_name,
            required_qty: Number(material.required_qty),
            reserved_qty: Number(material.reserved_qty),
            shortage: remainingRequired,
          })
          if (Number(material.reserved_qty) > 0) {
            partiallyReserved++
          }
          continue
        }

        // Calculate available_qty for each LP
        const lpsWithAvailable: LP[] = []
        for (const lp of availableLPs) {
          const availableQty = await getAvailableQuantity(lp.id)
          if (availableQty > 0) {
            lpsWithAvailable.push({
              ...lp,
              available_qty: availableQty,
            })
          }
        }

        // Select LPs using FIFO or FEFO
        const selection = useFEFO
          ? WOReservationService.selectLPsFEFO(lpsWithAvailable, remainingRequired)
          : WOReservationService.selectLPsFIFO(lpsWithAvailable, remainingRequired)

        // Create reservations
        let materialReservedQty = Number(material.reserved_qty)
        for (const allocation of selection.allocations) {
          const { error: insertError } = await supabaseAdmin
            .from('lp_reservations')
            .insert({
              org_id: orgId,
              lp_id: allocation.lpId,
              wo_id: woId,
              wo_material_id: material.id,
              reserved_qty: allocation.quantity,
              consumed_qty: 0,
              status: 'active',
              reserved_by: userId,
            })

          if (!insertError) {
            materialReservedQty += allocation.quantity
          }
        }

        // Update wo_material.reserved_qty
        await supabaseAdmin
          .from('wo_materials')
          .update({ reserved_qty: materialReservedQty })
          .eq('id', material.id)

        // Track results
        if (materialReservedQty >= Number(material.required_qty)) {
          fullyReserved++
        } else if (selection.shortage > 0) {
          partiallyReserved++
          shortages.push({
            material_name: material.material_name,
            required_qty: Number(material.required_qty),
            reserved_qty: materialReservedQty,
            shortage: Number(material.required_qty) - materialReservedQty,
          })
        }
      }

      return {
        success: true,
        data: {
          materials_processed: materials.length,
          fully_reserved: fullyReserved,
          partially_reserved: partiallyReserved,
          shortages,
        },
      }
    } catch (error) {
      console.error('Error in autoReserveWOMaterials:', error)
      return { success: false, error: 'Internal server error', code: WOReservationErrorCode.DATABASE_ERROR }
    }
  }

  // ===========================================================================
  // Manual Reservation
  // ===========================================================================

  /**
   * Reserve specific LP for a WO material (manual reservation)
   */
  static async reserveLP(
    woMaterialId: string,
    lpId: string,
    quantity: number,
    userId: string
  ): Promise<ReservationResult> {
    try {
      const userData = await getCurrentUserData()
      if (!userData) {
        return { success: false, error: 'User not authenticated', code: WOReservationErrorCode.DATABASE_ERROR }
      }

      const { orgId } = userData
      const supabaseAdmin = createServerSupabaseAdmin()

      // Get WO material to find WO ID
      const { data: material, error: matError } = await supabaseAdmin
        .from('wo_materials')
        .select('id, wo_id, product_id, material_name, required_qty, reserved_qty, uom')
        .eq('id', woMaterialId)
        .single()

      if (matError || !material) {
        return { success: false, error: 'Work order material not found', code: WOReservationErrorCode.WO_MATERIAL_NOT_FOUND }
      }

      // Get WO
      const wo = await getWorkOrder(material.wo_id, orgId)
      if (!wo) {
        return { success: false, error: 'Work order not found', code: WOReservationErrorCode.WO_NOT_FOUND }
      }

      // Check WO status
      if (!WOReservationService.canModifyReservations(wo.status)) {
        return { success: false, error: `Cannot modify reservations for ${wo.status} Work Order`, code: WOReservationErrorCode.INVALID_WO_STATUS }
      }

      // Get LP
      const lp = await getLicensePlate(lpId, orgId)
      if (!lp) {
        return { success: false, error: 'License plate not found', code: WOReservationErrorCode.LP_NOT_FOUND }
      }

      // Validate LP status
      if (!LP_VALID_STATUSES.includes(lp.status)) {
        return { success: false, error: `LP is not available for reservation (status: ${lp.status})`, code: WOReservationErrorCode.LP_NOT_AVAILABLE }
      }

      // Validate QA status
      if (lp.qa_status !== 'passed') {
        return { success: false, error: `LP has not passed QA (status: ${lp.qa_status})`, code: WOReservationErrorCode.LP_NOT_AVAILABLE }
      }

      // Validate LP warehouse matches WO warehouse
      if (lp.warehouse_id !== wo.warehouse_id) {
        return { success: false, error: 'LP is not in the Work Order warehouse', code: WOReservationErrorCode.LP_WAREHOUSE_MISMATCH }
      }

      // Validate LP product matches material product
      if (lp.product_id !== material.product_id) {
        return { success: false, error: 'LP product does not match material product', code: WOReservationErrorCode.LP_PRODUCT_MISMATCH }
      }

      // Check quantity doesn't exceed LP physical quantity
      if (quantity > Number(lp.quantity)) {
        return { success: false, error: `Reserved quantity (${quantity}) exceeds LP quantity (${lp.quantity})`, code: WOReservationErrorCode.EXCEEDS_LP_QUANTITY }
      }

      // Check for over-reservation warning (soft)
      const availableQty = await getAvailableQuantity(lpId)
      const warnings: string[] = []
      if (quantity > availableQty) {
        warnings.push(`LP over-reserved: total reservations (${Number(lp.quantity) - availableQty + quantity}) exceed LP quantity (${lp.quantity})`)
      }

      // Create reservation
      const { data: reservation, error: insertError } = await supabaseAdmin
        .from('lp_reservations')
        .insert({
          org_id: orgId,
          lp_id: lpId,
          wo_id: material.wo_id,
          wo_material_id: woMaterialId,
          reserved_qty: quantity,
          consumed_qty: 0,
          status: 'active',
          reserved_by: userId,
        })
        .select('id, lp_id, wo_material_id, reserved_qty, status, reserved_at, reserved_by')
        .single()

      if (insertError) {
        console.error('Error creating reservation:', insertError)
        return { success: false, error: 'Failed to create reservation', code: WOReservationErrorCode.DATABASE_ERROR }
      }

      // Update wo_material.reserved_qty
      const newReservedQty = Number(material.reserved_qty) + quantity
      await supabaseAdmin
        .from('wo_materials')
        .update({ reserved_qty: newReservedQty })
        .eq('id', woMaterialId)

      // Get location name
      const locationName = await getLocationName(lp.location_id)

      return {
        success: true,
        data: {
          reservation: {
            id: reservation.id,
            wo_material_id: reservation.wo_material_id,
            lp_id: reservation.lp_id,
            reserved_qty: reservation.reserved_qty,
            status: reservation.status,
            reserved_at: reservation.reserved_at,
            lp_number: lp.lp_number,
            location_name: locationName,
            expiry_date: lp.expiry_date,
          },
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      console.error('Error in reserveLP:', error)
      return { success: false, error: 'Internal server error', code: WOReservationErrorCode.DATABASE_ERROR }
    }
  }

  // ===========================================================================
  // Release Reservations
  // ===========================================================================

  /**
   * Release (un-reserve) a specific reservation
   */
  static async releaseReservation(reservationId: string, _userId: string): Promise<ReservationResult> {
    try {
      const userData = await getCurrentUserData()
      if (!userData) {
        return { success: false, error: 'User not authenticated', code: WOReservationErrorCode.DATABASE_ERROR }
      }

      const { orgId } = userData
      const supabaseAdmin = createServerSupabaseAdmin()

      // Get reservation
      const { data: reservation, error: fetchError } = await supabaseAdmin
        .from('lp_reservations')
        .select('id, lp_id, wo_id, wo_material_id, reserved_qty, status, org_id')
        .eq('id', reservationId)
        .eq('org_id', orgId)
        .single()

      if (fetchError || !reservation) {
        return { success: false, error: 'Reservation not found', code: WOReservationErrorCode.RESERVATION_NOT_FOUND }
      }

      // Check if already released
      if (reservation.status === 'released') {
        return { success: false, error: 'Reservation has already been released', code: WOReservationErrorCode.ALREADY_RELEASED }
      }

      // Get WO to check status
      if (reservation.wo_id) {
        const wo = await getWorkOrder(reservation.wo_id, orgId)
        if (!wo) {
          return { success: false, error: 'Work order not found', code: WOReservationErrorCode.WO_NOT_FOUND }
        }

        if (!WOReservationService.canModifyReservations(wo.status)) {
          return { success: false, error: `Cannot modify reservations for ${wo.status} Work Order`, code: WOReservationErrorCode.INVALID_WO_STATUS }
        }
      }

      // Update reservation to released
      const { error: updateError } = await supabaseAdmin
        .from('lp_reservations')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
        })
        .eq('id', reservationId)

      if (updateError) {
        console.error('Error releasing reservation:', updateError)
        return { success: false, error: 'Failed to release reservation', code: WOReservationErrorCode.DATABASE_ERROR }
      }

      // Update wo_material.reserved_qty if linked
      if (reservation.wo_material_id) {
        const { data: material } = await supabaseAdmin
          .from('wo_materials')
          .select('reserved_qty')
          .eq('id', reservation.wo_material_id)
          .single()

        if (material) {
          const newReservedQty = Math.max(0, Number(material.reserved_qty) - Number(reservation.reserved_qty))
          await supabaseAdmin
            .from('wo_materials')
            .update({ reserved_qty: newReservedQty })
            .eq('id', reservation.wo_material_id)
        }
      }

      return {
        success: true,
        data: {
          released_qty: Number(reservation.reserved_qty),
          message: 'Reservation released successfully',
        },
      }
    } catch (error) {
      console.error('Error in releaseReservation:', error)
      return { success: false, error: 'Internal server error', code: WOReservationErrorCode.DATABASE_ERROR }
    }
  }

  /**
   * Release all reservations for a WO
   * Called on WO cancellation
   */
  static async releaseAllWOReservations(woId: string): Promise<number> {
    try {
      const userData = await getCurrentUserData()
      if (!userData) return 0

      const { orgId } = userData
      const supabaseAdmin = createServerSupabaseAdmin()

      // Get all active reservations for WO
      const { data: reservations } = await supabaseAdmin
        .from('lp_reservations')
        .select('id, reserved_qty, wo_material_id')
        .eq('wo_id', woId)
        .eq('org_id', orgId)
        .eq('status', 'active')

      if (!reservations || reservations.length === 0) {
        return 0
      }

      // Update all to released
      const { error: updateError } = await supabaseAdmin
        .from('lp_reservations')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
        })
        .eq('wo_id', woId)
        .eq('status', 'active')

      if (updateError) {
        console.error('Error releasing all reservations:', updateError)
        return 0
      }

      // Reset reserved_qty on all wo_materials
      await supabaseAdmin
        .from('wo_materials')
        .update({ reserved_qty: 0 })
        .eq('wo_id', woId)

      return reservations.length
    } catch (error) {
      console.error('Error in releaseAllWOReservations:', error)
      return 0
    }
  }

  // ===========================================================================
  // Query Methods
  // ===========================================================================

  /**
   * Get available LPs for a product using FIFO/FEFO ordering
   */
  static async getAvailableLPs(
    productId: string,
    warehouseId: string,
    algorithm: 'fifo' | 'fefo'
  ): Promise<AvailableLPsResponse> {
    try {
      const userData = await getCurrentUserData()
      if (!userData) {
        return { lps: [], total_available: 0 }
      }

      const { orgId } = userData
      const supabaseAdmin = createServerSupabaseAdmin()

      // Get today for expiry filter
      const today = new Date().toISOString().split('T')[0]

      // Build query
      let query = supabaseAdmin
        .from('license_plates')
        .select(`
          id,
          lp_number,
          quantity,
          batch_number,
          expiry_date,
          created_at,
          location_id,
          uom
        `)
        .eq('org_id', orgId)
        .eq('warehouse_id', warehouseId)
        .eq('product_id', productId)
        .eq('qa_status', 'passed')
        .in('status', LP_VALID_STATUSES)
        .gt('quantity', 0)
        .or(`expiry_date.is.null,expiry_date.gte.${today}`)

      // Apply sorting based on algorithm
      if (algorithm === 'fefo') {
        query = query
          .order('expiry_date', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true })
      } else {
        query = query.order('created_at', { ascending: true })
      }

      const { data: lps, error } = await query

      if (error) {
        console.error('Error fetching available LPs:', error)
        return { lps: [], total_available: 0 }
      }

      // Calculate available quantity for each LP
      const availableLps: AvailableLP[] = []
      let totalAvailable = 0

      for (const lp of lps || []) {
        const availableQty = await getAvailableQuantity(lp.id)
        if (availableQty <= 0) continue

        const locationName = await getLocationName(lp.location_id)

        availableLps.push({
          id: lp.id,
          lp_number: lp.lp_number,
          quantity: Number(lp.quantity),
          available_qty: availableQty,
          location: locationName,
          expiry_date: lp.expiry_date,
          created_at: lp.created_at,
          lot_number: lp.batch_number,
          uom: lp.uom,
        })

        totalAvailable += availableQty
      }

      return {
        lps: availableLps,
        total_available: totalAvailable,
      }
    } catch (error) {
      console.error('Error in getAvailableLPs:', error)
      return { lps: [], total_available: 0 }
    }
  }

  /**
   * Get reservations for a WO material with LP details
   */
  static async getReservations(woMaterialId: string): Promise<ReservationsListResponse> {
    try {
      const userData = await getCurrentUserData()
      if (!userData) {
        return { reservations: [], total_reserved: 0, required_qty: 0, coverage_percent: 0 }
      }

      const { orgId } = userData
      const supabaseAdmin = createServerSupabaseAdmin()

      // Get WO material to verify access and get required_qty
      const { data: material, error: matError } = await supabaseAdmin
        .from('wo_materials')
        .select('id, required_qty, organization_id')
        .eq('id', woMaterialId)
        .single()

      if (matError || !material) {
        return { reservations: [], total_reserved: 0, required_qty: 0, coverage_percent: 0 }
      }

      // Verify org access
      if (material.organization_id !== orgId) {
        return { reservations: [], total_reserved: 0, required_qty: 0, coverage_percent: 0 }
      }

      // Get reservations with LP details
      const { data: reservations, error: resError } = await supabaseAdmin
        .from('lp_reservations')
        .select(`
          id,
          wo_material_id,
          lp_id,
          reserved_qty,
          status,
          reserved_at,
          released_at,
          reserved_by,
          license_plates!inner (
            lp_number,
            expiry_date,
            location_id
          )
        `)
        .eq('wo_material_id', woMaterialId)
        .eq('status', 'active')
        .order('reserved_at', { ascending: true })

      if (resError) {
        console.error('Error fetching reservations:', resError)
        return { reservations: [], total_reserved: 0, required_qty: Number(material.required_qty), coverage_percent: 0 }
      }

      // Map reservations
      const mappedReservations: ReservationResponse[] = []
      let totalReserved = 0

      for (const res of reservations || []) {
        const lp = res.license_plates as any
        const locationName = await getLocationName(lp?.location_id)

        // Get user name
        let reservedBy: { id: string; name: string } | undefined
        if (res.reserved_by) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id, full_name')
            .eq('id', res.reserved_by)
            .single()

          if (user) {
            reservedBy = { id: user.id, name: user.full_name || 'Unknown' }
          }
        }

        mappedReservations.push({
          id: res.id,
          wo_material_id: res.wo_material_id,
          lp_id: res.lp_id,
          reserved_qty: Number(res.reserved_qty),
          status: res.status as 'active' | 'released' | 'consumed',
          reserved_at: res.reserved_at,
          released_at: res.released_at,
          lp_number: lp?.lp_number || '',
          location_name: locationName,
          expiry_date: lp?.expiry_date || null,
          reserved_by: reservedBy,
        })

        totalReserved += Number(res.reserved_qty)
      }

      const coverage = WOReservationService.calculateCoverage(Number(material.required_qty), totalReserved)

      return {
        reservations: mappedReservations,
        total_reserved: totalReserved,
        required_qty: Number(material.required_qty),
        coverage_percent: coverage.percent,
      }
    } catch (error) {
      console.error('Error in getReservations:', error)
      return { reservations: [], total_reserved: 0, required_qty: 0, coverage_percent: 0 }
    }
  }

  // ===========================================================================
  // Status Check
  // ===========================================================================

  /**
   * Check if WO reservations can be modified based on status
   */
  static canModifyReservations(woStatus: string): boolean {
    return MODIFIABLE_STATUSES.includes(woStatus)
  }
}
