// Material Reservation Service
// Story 4.7: Material Reservation (Desktop)
// Handles LP reservation for work orders with atomic transactions

import { SupabaseClient } from '@supabase/supabase-js'

// Error codes for material reservation (AC-4.7.6)
export const ReservationErrorCodes = {
  LP_NOT_FOUND: 'LP_NOT_FOUND',
  PRODUCT_MISMATCH: 'PRODUCT_MISMATCH',
  UOM_MISMATCH: 'UOM_MISMATCH',
  INSUFFICIENT_QTY: 'INSUFFICIENT_QTY',
  LP_ALREADY_RESERVED: 'LP_ALREADY_RESERVED',
  WO_NOT_IN_PROGRESS: 'WO_NOT_IN_PROGRESS',
  CONSUME_WHOLE_LP_VIOLATION: 'CONSUME_WHOLE_LP_VIOLATION',
  MATERIAL_NOT_IN_BOM: 'MATERIAL_NOT_IN_BOM',
  WO_NOT_FOUND: 'WO_NOT_FOUND',
  ORG_ISOLATION: 'ORG_ISOLATION',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONCURRENCY_ERROR: 'CONCURRENCY_ERROR',
  RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
} as const

export type ReservationErrorCode = (typeof ReservationErrorCodes)[keyof typeof ReservationErrorCodes]

export interface ReservationError {
  code: ReservationErrorCode
  message: string
  details?: Record<string, unknown>
}

export interface ReserveMaterialInput {
  woId: string
  materialId: string
  lpId: string
  reservedQty: number
  notes?: string
  userId: string
  orgId: string
}

export interface ReservationResult {
  id: string
  wo_id: string
  material_id: string
  material_name: string
  lp_id: string
  lp_number: string
  reserved_qty: number
  uom: string
  sequence_number: number
  status: string
  reserved_at: string
  reserved_by_user: {
    id: string
    name: string
  }
}

export interface UnreserveMaterialInput {
  reservationId: string
  woId: string
  userId: string
  orgId: string
}

export interface MaterialWithReservations {
  id: string
  product_id: string
  material_name: string
  required_qty: number
  reserved_qty: number
  consumed_qty: number
  uom: string
  consume_whole_lp: boolean
  reservations: Array<{
    id: string
    lp_id: string
    lp_number: string
    reserved_qty: number
    sequence_number: number
    status: string
    reserved_at: string
    reserved_by_user: {
      id: string
      name: string
    }
  }>
}

// Allowed roles for reservation operations (AC-4.7.8)
const ALLOWED_ROLES = ['admin', 'manager', 'operator']

export class MaterialReservationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get materials with their reservations for a work order (AC-4.7.1)
   */
  async getMaterialsWithReservations(
    woId: string,
    orgId: string
  ): Promise<{ data: MaterialWithReservations[] | null; error: ReservationError | null }> {
    // Get materials from wo_materials
    const { data: materials, error: materialsError } = await this.supabase
      .from('wo_materials')
      .select(`
        id,
        product_id,
        material_name,
        required_qty,
        reserved_qty,
        consumed_qty,
        uom,
        consume_whole_lp,
        sequence
      `)
      .eq('wo_id', woId)
      .eq('organization_id', orgId)
      .eq('is_by_product', false)
      .order('sequence', { ascending: true })

    if (materialsError) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.VALIDATION_ERROR,
          message: materialsError.message,
        },
      }
    }

    // Get reservations for each material
    const { data: reservations, error: reservationsError } = await this.supabase
      .from('wo_material_reservations')
      .select(`
        id,
        material_id,
        lp_id,
        reserved_qty,
        sequence_number,
        status,
        reserved_at,
        reserved_by_user_id,
        license_plates!inner (
          lp_number
        ),
        users!wo_material_reservations_reserved_by_user_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('wo_id', woId)
      .eq('org_id', orgId)
      .eq('status', 'reserved')
      .order('sequence_number', { ascending: true })

    if (reservationsError) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.VALIDATION_ERROR,
          message: reservationsError.message,
        },
      }
    }

    // Map reservations to materials
    const materialsWithReservations: MaterialWithReservations[] = (materials || []).map((material) => {
      const materialReservations = (reservations || [])
        .filter((r) => r.material_id === material.id)
        .map((r) => {
          // Handle Supabase join results (can be object or array)
          const lpData = r.license_plates as unknown as { lp_number: string } | { lp_number: string }[]
          const lpNumber = Array.isArray(lpData) ? lpData[0]?.lp_number : lpData?.lp_number
          const userData = r.users as unknown as { id: string; first_name?: string; last_name?: string } | { id: string; first_name?: string; last_name?: string }[]
          const user = Array.isArray(userData) ? userData[0] : userData

          return {
            id: r.id,
            lp_id: r.lp_id,
            lp_number: lpNumber || '',
            reserved_qty: r.reserved_qty,
            sequence_number: r.sequence_number,
            status: r.status,
            reserved_at: r.reserved_at,
            reserved_by_user: {
              id: user?.id || '',
              name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
            },
          }
        })

      return {
        ...material,
        reservations: materialReservations,
      }
    })

    return { data: materialsWithReservations, error: null }
  }

  /**
   * Reserve material from LP (AC-4.7.3)
   * Atomic transaction: creates reservation, updates LP status, creates genealogy
   */
  async reserveMaterial(
    input: ReserveMaterialInput,
    userRole: string
  ): Promise<{ data: ReservationResult | null; error: ReservationError | null }> {
    const { woId, materialId, lpId, reservedQty, notes, userId, orgId } = input

    // Check role permission (AC-4.7.8)
    if (!ALLOWED_ROLES.includes(userRole.toLowerCase())) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.FORBIDDEN,
          message: 'Insufficient permissions to reserve materials',
        },
      }
    }

    // 1. Validate WO exists and is in_progress
    const { data: wo, error: woError } = await this.supabase
      .from('work_orders')
      .select('id, status, org_id')
      .eq('id', woId)
      .single()

    if (woError || !wo) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.WO_NOT_FOUND,
          message: 'Work order not found',
        },
      }
    }

    if (wo.org_id !== orgId) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.ORG_ISOLATION,
          message: 'Access denied',
        },
      }
    }

    if (wo.status !== 'in_progress') {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.WO_NOT_IN_PROGRESS,
          message: `WO must be in_progress to reserve materials. Current status: ${wo.status}`,
        },
      }
    }

    // 2. Validate material exists in WO BOM
    const { data: material, error: materialError } = await this.supabase
      .from('wo_materials')
      .select('id, product_id, material_name, required_qty, reserved_qty, uom, consume_whole_lp')
      .eq('id', materialId)
      .eq('wo_id', woId)
      .single()

    if (materialError || !material) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.MATERIAL_NOT_IN_BOM,
          message: 'Material not found in WO BOM',
        },
      }
    }

    // 3. Validate LP exists and is available
    const { data: lp, error: lpError } = await this.supabase
      .from('license_plates')
      .select('id, lp_number, product_id, quantity, current_qty, uom, status, org_id')
      .eq('id', lpId)
      .single()

    if (lpError || !lp) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.LP_NOT_FOUND,
          message: `License plate not found`,
        },
      }
    }

    if (lp.org_id !== orgId) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.ORG_ISOLATION,
          message: 'Access denied',
        },
      }
    }

    // 4. Validate LP product matches material product
    if (lp.product_id !== material.product_id) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.PRODUCT_MISMATCH,
          message: `LP product does not match material. LP has different product than ${material.material_name}`,
        },
      }
    }

    // 5. Validate UoM matches
    if (lp.uom !== material.uom) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.UOM_MISMATCH,
          message: `LP UoM (${lp.uom}) does not match material UoM (${material.uom})`,
        },
      }
    }

    // 6. Validate LP qty
    const availableQty = lp.current_qty ?? lp.quantity
    if (availableQty < reservedQty) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.INSUFFICIENT_QTY,
          message: `LP ${lp.lp_number} has ${availableQty}${lp.uom} available. Requested ${reservedQty}${lp.uom} for reservation`,
        },
      }
    }

    // 7. Check LP not already reserved for this WO
    const { data: existingReservation } = await this.supabase
      .from('wo_material_reservations')
      .select('id')
      .eq('wo_id', woId)
      .eq('lp_id', lpId)
      .eq('status', 'reserved')
      .single()

    if (existingReservation) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.LP_ALREADY_RESERVED,
          message: `LP ${lp.lp_number} already reserved for this WO`,
        },
      }
    }

    // 8. Check LP status is available
    if (lp.status !== 'available') {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.LP_ALREADY_RESERVED,
          message: `LP ${lp.lp_number} is not available (status: ${lp.status})`,
        },
      }
    }

    // 9. Validate consume_whole_lp constraint (AC-4.7.2)
    if (material.consume_whole_lp && reservedQty !== availableQty) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.CONSUME_WHOLE_LP_VIOLATION,
          message: `Material ${material.material_name} must use entire LP (${availableQty}${lp.uom}). Cannot reserve ${reservedQty}${lp.uom} partial`,
        },
      }
    }

    // 10. Get next sequence number for this material
    const { data: maxSeq } = await this.supabase
      .from('wo_material_reservations')
      .select('sequence_number')
      .eq('wo_id', woId)
      .eq('material_id', materialId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single()

    const nextSequence = (maxSeq?.sequence_number || 0) + 1

    // 11. ATOMIC TRANSACTION: Create reservation, update LP, create genealogy
    // Create reservation
    const { data: reservation, error: reservationError } = await this.supabase
      .from('wo_material_reservations')
      .insert({
        org_id: orgId,
        wo_id: woId,
        material_id: materialId,
        lp_id: lpId,
        reserved_qty: reservedQty,
        uom: material.uom,
        sequence_number: nextSequence,
        status: 'reserved',
        reserved_by_user_id: userId,
        notes: notes || null,
      })
      .select()
      .single()

    if (reservationError) {
      // Check for concurrency error (unique constraint violation)
      if (reservationError.code === '23505') {
        return {
          data: null,
          error: {
            code: ReservationErrorCodes.CONCURRENCY_ERROR,
            message: 'Material reservation modified by another user. Please retry.',
          },
        }
      }
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.VALIDATION_ERROR,
          message: reservationError.message,
        },
      }
    }

    // Update LP status to 'reserved'
    const { error: lpUpdateError } = await this.supabase
      .from('license_plates')
      .update({
        status: 'reserved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', lpId)

    if (lpUpdateError) {
      // Rollback reservation
      await this.supabase.from('wo_material_reservations').delete().eq('id', reservation.id)
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.VALIDATION_ERROR,
          message: 'Failed to update LP status',
        },
      }
    }

    // Update wo_materials reserved_qty
    const newReservedQty = Number(material.reserved_qty || 0) + reservedQty
    const { error: materialUpdateError } = await this.supabase
      .from('wo_materials')
      .update({
        reserved_qty: newReservedQty,
        updated_at: new Date().toISOString(),
      })
      .eq('id', materialId)

    if (materialUpdateError) {
      // Rollback
      await this.supabase.from('wo_material_reservations').delete().eq('id', reservation.id)
      await this.supabase.from('license_plates').update({ status: 'available' }).eq('id', lpId)
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.VALIDATION_ERROR,
          message: 'Failed to update material reserved qty',
        },
      }
    }

    // Create genealogy record (AC-4.7.10)
    const { error: genealogyError } = await this.supabase.from('lp_genealogy').insert({
      parent_lp_id: lpId,
      child_lp_id: null, // Will be filled in Story 4.12 output registration
      relationship_type: 'production',
      work_order_id: woId,
      quantity_from_parent: reservedQty,
      uom: material.uom,
      wo_material_reservation_id: reservation.id,
      reserved_at: new Date().toISOString(),
      reserved_by_user_id: userId,
      created_by: userId,
    })

    if (genealogyError) {
      // Rollback all
      await this.supabase.from('wo_material_reservations').delete().eq('id', reservation.id)
      await this.supabase.from('license_plates').update({ status: 'available' }).eq('id', lpId)
      await this.supabase
        .from('wo_materials')
        .update({ reserved_qty: material.reserved_qty })
        .eq('id', materialId)
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.VALIDATION_ERROR,
          message: 'Failed to create genealogy record',
        },
      }
    }

    // Get user info for response
    const { data: user } = await this.supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('id', userId)
      .single()

    const result: ReservationResult = {
      id: reservation.id,
      wo_id: reservation.wo_id,
      material_id: reservation.material_id,
      material_name: material.material_name,
      lp_id: reservation.lp_id,
      lp_number: lp.lp_number,
      reserved_qty: reservation.reserved_qty,
      uom: reservation.uom,
      sequence_number: reservation.sequence_number,
      status: reservation.status,
      reserved_at: reservation.reserved_at,
      reserved_by_user: {
        id: user?.id || userId,
        name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown',
      },
    }

    return { data: result, error: null }
  }

  /**
   * Unreserve material (AC-4.7.5)
   * Cancels reservation, reverts LP status, removes genealogy
   */
  async unreserveMaterial(
    input: UnreserveMaterialInput,
    userRole: string
  ): Promise<{ data: { material_id: string; material_name: string; reserved_qty: number; lp_id: string; lp_number: string } | null; error: ReservationError | null }> {
    const { reservationId, woId, userId, orgId } = input

    // Check role permission
    if (!ALLOWED_ROLES.includes(userRole.toLowerCase())) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.FORBIDDEN,
          message: 'Insufficient permissions to unreserve materials',
        },
      }
    }

    // Get reservation
    const { data: reservation, error: reservationError } = await this.supabase
      .from('wo_material_reservations')
      .select(`
        id,
        wo_id,
        material_id,
        lp_id,
        reserved_qty,
        uom,
        org_id,
        status,
        wo_materials!inner (
          id,
          material_name,
          reserved_qty
        ),
        license_plates!inner (
          lp_number
        )
      `)
      .eq('id', reservationId)
      .eq('wo_id', woId)
      .single()

    if (reservationError || !reservation) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.RESERVATION_NOT_FOUND,
          message: 'Reservation not found',
        },
      }
    }

    if (reservation.org_id !== orgId) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.ORG_ISOLATION,
          message: 'Access denied',
        },
      }
    }

    if (reservation.status !== 'reserved') {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.VALIDATION_ERROR,
          message: `Cannot unreserve: reservation status is ${reservation.status}`,
        },
      }
    }

    // Delete reservation
    const { error: deleteError } = await this.supabase
      .from('wo_material_reservations')
      .delete()
      .eq('id', reservationId)

    if (deleteError) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.VALIDATION_ERROR,
          message: deleteError.message,
        },
      }
    }

    // Revert LP status to available
    await this.supabase
      .from('license_plates')
      .update({
        status: 'available',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation.lp_id)

    // Update wo_materials reserved_qty
    // Handle Supabase join results (can be object or array)
    const materialData = reservation.wo_materials as unknown as { id: string; material_name: string; reserved_qty: number } | { id: string; material_name: string; reserved_qty: number }[]
    const material = Array.isArray(materialData) ? materialData[0] : materialData
    const newReservedQty = Math.max(0, Number(material?.reserved_qty || 0) - reservation.reserved_qty)
    await this.supabase
      .from('wo_materials')
      .update({
        reserved_qty: newReservedQty,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation.material_id)

    // Delete genealogy record
    await this.supabase
      .from('lp_genealogy')
      .delete()
      .eq('wo_material_reservation_id', reservationId)

    // Handle Supabase join results for LP
    const lpRaw = reservation.license_plates as unknown as { lp_number: string } | { lp_number: string }[]
    const lpData = Array.isArray(lpRaw) ? lpRaw[0] : lpRaw

    return {
      data: {
        material_id: reservation.material_id,
        material_name: material?.material_name || '',
        reserved_qty: reservation.reserved_qty,
        lp_id: reservation.lp_id,
        lp_number: lpData?.lp_number || '',
      },
      error: null,
    }
  }

  /**
   * Search available LPs for a material (for LP selection in modal)
   */
  async searchAvailableLPs(
    productId: string,
    uom: string,
    orgId: string,
    search?: string
  ): Promise<{
    data: Array<{
      id: string
      lp_number: string
      quantity: number
      current_qty: number
      uom: string
      expiry_date: string | null
      location_name: string | null
    }> | null
    error: ReservationError | null
  }> {
    let query = this.supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        quantity,
        current_qty,
        uom,
        expiry_date,
        locations (
          name
        )
      `)
      .eq('product_id', productId)
      .eq('uom', uom)
      .eq('org_id', orgId)
      .eq('status', 'available')
      .gt('current_qty', 0)
      .order('expiry_date', { ascending: true, nullsFirst: false })

    if (search) {
      query = query.ilike('lp_number', `%${search}%`)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      return {
        data: null,
        error: {
          code: ReservationErrorCodes.VALIDATION_ERROR,
          message: error.message,
        },
      }
    }

    return {
      data: (data || []).map((lp) => {
        // Handle Supabase join results for locations
        const locRaw = lp.locations as unknown as { name: string } | { name: string }[] | null
        const location = Array.isArray(locRaw) ? locRaw[0] : locRaw

        return {
          id: lp.id,
          lp_number: lp.lp_number,
          quantity: lp.quantity,
          current_qty: lp.current_qty ?? lp.quantity,
          uom: lp.uom,
          expiry_date: lp.expiry_date,
          location_name: location?.name || null,
        }
      }),
      error: null,
    }
  }
}
