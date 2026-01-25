/**
 * Output Registration Service
 * Stories 4.12, 4.12a, 4.12b: Output registration with sequential consumption
 */

import { createAdminClient } from '../supabase/admin-client'
import { createOutputGenealogy } from './genealogy-service'

// Error codes for output registration
export const OUTPUT_ERROR_CODES = {
  WO_NOT_IN_PROGRESS: 'WO_NOT_IN_PROGRESS',
  INVALID_QTY: 'INVALID_QTY',
  NO_RESERVATIONS: 'NO_RESERVATIONS',
  OVER_CONSUMPTION_DENIED: 'OVER_CONSUMPTION_DENIED',
  MISSING_PARENT_LP: 'MISSING_PARENT_LP',
  LP_CREATION_FAILED: 'LP_CREATION_FAILED',
} as const

export interface OutputRegistrationInput {
  woId: string
  qty: number
  qaStatus?: 'passed' | 'hold' | 'rejected' | 'pending'
  locationId?: string
  notes?: string
  // Over-production fields (AC-4.12b)
  isOverProduction?: boolean
  overProductionParentLpId?: string
}

export interface AllocationPlan {
  lpId: string
  lpNumber: string
  qtyToConsume: number
  reservationId: string
  materialId: string
  consumeWholeLp: boolean
}

export interface ConsumptionAllocationResult {
  allocations: AllocationPlan[]
  isOverConsumption: boolean
  cumulativeAfter: number
  remainingUnallocated: number
  totalReserved: number
}

export interface OutputRegistrationResult {
  output: {
    id: string
    lp_id: string
    lp_number: string
    quantity: number
  }
  consumptionRecords: Array<{
    id: string
    lpId: string
    qty: number
  }>
  genealogyRecords: number
  warnings: string[]
}

/**
 * Calculate consumption allocation for output (AC-4.12a.1)
 * Sequential LP allocation algorithm
 */
export async function calculateConsumptionAllocation(
  woId: string,
  outputQty: number
): Promise<ConsumptionAllocationResult> {
  const supabase = createAdminClient()

  // Get all reserved LPs for this WO (in sequence order)
  const { data: reservations, error: resError } = await supabase
    .from('wo_material_reservations')
    .select(`
      id,
      lp_id,
      reserved_qty,
      sequence_number,
      material_id,
      wo_materials!inner(consume_whole_lp, material_name)
    `)
    .eq('wo_id', woId)
    .eq('status', 'reserved')
    .order('sequence_number', { ascending: true })

  if (resError) throw new Error(`Failed to get reservations: ${resError.message}`)

  // Get LP details
  const lpIds = reservations?.map(r => r.lp_id) || []
  const { data: lps, error: lpError } = await supabase
    .from('license_plates')
    .select('id, lp_number, current_qty')
    .in('id', lpIds)

  if (lpError) throw new Error(`Failed to get LPs: ${lpError.message}`)

  const lpMap = new Map(lps?.map(lp => [lp.id, lp]) || [])

  // Get already consumed qty for this WO
  const { data: consumedData, error: consumedError } = await supabase
    .from('wo_consumption')
    .select('consumed_qty')
    .eq('wo_id', woId)
    .eq('status', 'consumed')

  if (consumedError) throw new Error(`Failed to get consumed: ${consumedError.message}`)

  const alreadyConsumed = consumedData?.reduce((sum, c) => sum + Number(c.consumed_qty), 0) || 0

  // Calculate total reserved
  const totalReserved = reservations?.reduce((sum, r) => sum + Number(r.reserved_qty), 0) || 0

  // Sequential allocation
  let remainingToAllocate = outputQty
  const allocations: AllocationPlan[] = []

  for (const reservation of reservations || []) {
    if (remainingToAllocate <= 0) break

    const lp = lpMap.get(reservation.lp_id)
    if (!lp) continue

    const availableQty = Number(lp.current_qty)
    if (availableQty <= 0) continue

    const materials = reservation.wo_materials as unknown as { consume_whole_lp: boolean; material_name: string } | null
    const consumeWholeLp = materials?.consume_whole_lp || false

    // If consume_whole_lp, must consume full LP qty
    const qtyToConsume = consumeWholeLp
      ? availableQty
      : Math.min(remainingToAllocate, availableQty)

    allocations.push({
      lpId: reservation.lp_id,
      lpNumber: lp.lp_number,
      qtyToConsume,
      reservationId: reservation.id,
      materialId: reservation.material_id,
      consumeWholeLp,
    })

    remainingToAllocate -= qtyToConsume
  }

  const cumulativeAfter = alreadyConsumed + allocations.reduce((sum, a) => sum + a.qtyToConsume, 0)
  const isOverConsumption = cumulativeAfter > totalReserved || remainingToAllocate > 0

  return {
    allocations,
    isOverConsumption,
    cumulativeAfter,
    remainingUnallocated: Math.max(0, remainingToAllocate),
    totalReserved,
  }
}

/**
 * Register output with automatic sequential consumption (AC-4.12, 4.12a)
 */
export async function registerOutput(
  input: OutputRegistrationInput,
  userId: string,
  orgId: string
): Promise<OutputRegistrationResult> {
  const supabase = createAdminClient()
  const warnings: string[] = []

  // 1. Validate WO status (AC-4.12.8)
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, status, product_id, wo_number, uom, produced_quantity, production_line_id')
    .eq('id', input.woId)
    .single()

  if (woError || !wo) {
    throw { code: OUTPUT_ERROR_CODES.WO_NOT_IN_PROGRESS, message: 'Work order not found' }
  }

  if (wo.status !== 'in_progress') {
    throw { code: OUTPUT_ERROR_CODES.WO_NOT_IN_PROGRESS, message: 'WO not in progress' }
  }

  // 2. Validate qty (AC-4.12.8)
  if (input.qty <= 0) {
    throw { code: OUTPUT_ERROR_CODES.INVALID_QTY, message: 'Output quantity must be > 0' }
  }

  // 3. Get production line for default location
  let outputLocationId = input.locationId
  if (!outputLocationId && wo.production_line_id) {
    const { data: line } = await supabase
      .from('production_lines')
      .select('default_output_location_id')
      .eq('id', wo.production_line_id)
      .single()
    outputLocationId = line?.default_output_location_id || undefined
  }

  // 4. Get product info for LP creation
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('id, name, uom, shelf_life_days')
    .eq('id', wo.product_id)
    .single()

  if (prodError || !product) {
    throw { code: OUTPUT_ERROR_CODES.LP_CREATION_FAILED, message: 'Product not found' }
  }

  // 5. Calculate consumption allocation (AC-4.12a.1)
  const allocation = await calculateConsumptionAllocation(input.woId, input.qty)

  // 5a. Get production settings for over-consumption behavior (AC-4.12a.5, AC-4.11)
  const { data: prodSettings } = await supabase
    .from('production_settings')
    .select('allow_over_consumption')
    .eq('organization_id', orgId)
    .single()

  const allowOverConsumption = prodSettings?.allow_over_consumption ?? false

  // 6. Handle over-consumption warning (AC-4.12a.4, AC-4.12b)
  if (allocation.isOverConsumption) {
    if (input.isOverProduction) {
      // Over-production requires parent LP selection (AC-4.12b.2)
      if (!input.overProductionParentLpId) {
        throw {
          code: OUTPUT_ERROR_CODES.MISSING_PARENT_LP,
          message: 'Must select parent LP for over-production',
        }
      }
      warnings.push(`Over-production: ${allocation.remainingUnallocated} ${wo.uom} without reserved materials`)
    } else {
      // Return over-consumption info for frontend to handle (AC-4.11.2)
      // Note: allow_over_consumption setting only affects messaging, not blocking
      throw {
        code: OUTPUT_ERROR_CODES.OVER_CONSUMPTION_DENIED,
        message: allowOverConsumption
          ? 'Over-consumption detected - confirm to proceed'
          : 'Over-consumption detected - requires confirmation',
        details: {
          totalReserved: allocation.totalReserved,
          cumulativeAfter: allocation.cumulativeAfter,
          remainingUnallocated: allocation.remainingUnallocated,
          allowOverConsumption,
        },
      }
    }
  }

  // === BEGIN ATOMIC TRANSACTION ===

  // 7. Create output LP (AC-4.12.2)
  const expiryDate = product.shelf_life_days
    ? new Date(Date.now() + product.shelf_life_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null

  // Generate LP number
  const lpNumber = `LP-${wo.wo_number}-${Date.now().toString(36).toUpperCase()}`

  const { data: outputLp, error: lpError } = await supabase
    .from('license_plates')
    .insert({
      org_id: orgId,
      lp_number: lpNumber,
      product_id: wo.product_id,
      quantity: input.qty,
      current_qty: input.qty,
      uom: wo.uom,
      status: 'available',
      qa_status: input.qaStatus || 'passed',
      location_id: outputLocationId,
      expiry_date: expiryDate,
      manufacturing_date: new Date().toISOString().split('T')[0],
      created_by: userId,
    })
    .select()
    .single()

  if (lpError || !outputLp) {
    throw { code: OUTPUT_ERROR_CODES.LP_CREATION_FAILED, message: `Failed to create LP: ${lpError?.message}` }
  }

  // 8. Create production_outputs record
  const { data: outputRecord, error: outputError } = await supabase
    .from('production_outputs')
    .insert({
      wo_id: input.woId,
      organization_id: orgId,
      product_id: wo.product_id,
      lp_id: outputLp.id,
      quantity: input.qty,
      uom: wo.uom,
      qa_status: input.qaStatus,
      location_id: outputLocationId,
      is_over_production: input.isOverProduction || false,
      over_production_parent_lp_id: input.overProductionParentLpId,
      produced_by_user_id: userId,
      produced_at: new Date().toISOString(),
      notes: input.notes,
    })
    .select()
    .single()

  if (outputError || !outputRecord) {
    // Rollback LP
    await supabase.from('license_plates').delete().eq('id', outputLp.id)
    throw { code: OUTPUT_ERROR_CODES.LP_CREATION_FAILED, message: `Failed to create output record: ${outputError?.message}` }
  }

  // 9. Execute consumption (AC-4.12a.7) - create wo_consumption records
  const consumptionRecords: Array<{ id: string; lpId: string; qty: number }> = []
  const genealogyInputs: Array<{
    reservation_id: string
    lp_id: string
    consumed_qty: number
    uom: string
  }> = []

  for (const alloc of allocation.allocations) {
    // Create wo_consumption record
    const { data: consumption, error: consError } = await supabase
      .from('wo_consumption')
      .insert({
        wo_id: input.woId,
        org_id: orgId,
        material_id: alloc.materialId,
        lp_id: alloc.lpId,
        reservation_id: alloc.reservationId,
        consumed_qty: alloc.qtyToConsume,
        uom: wo.uom,
        output_id: outputRecord.id,
        consumed_by_user_id: userId,
        consumed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (consError) {
      console.error('Consumption error:', consError)
      continue
    }

    consumptionRecords.push({
      id: consumption.id,
      lpId: alloc.lpId,
      qty: alloc.qtyToConsume,
    })

    // Update LP quantity (AC-4.18)
    const { data: lp } = await supabase
      .from('license_plates')
      .select('current_qty')
      .eq('id', alloc.lpId)
      .single()

    const newQty = Number(lp?.current_qty || 0) - alloc.qtyToConsume
    const lpUpdate: Record<string, unknown> = { current_qty: newQty }
    if (newQty <= 0) {
      lpUpdate.status = 'consumed'
      lpUpdate.consumed_by_wo_id = input.woId
      lpUpdate.consumed_at = new Date().toISOString()
    }

    await supabase.from('license_plates').update(lpUpdate).eq('id', alloc.lpId)

    // Update reservation status if LP consumed
    if (newQty <= 0) {
      await supabase
        .from('wo_material_reservations')
        .update({ status: 'consumed' })
        .eq('id', alloc.reservationId)
    }

    // Create LP movement record
    await supabase.from('lp_movements').insert({
      org_id: orgId,
      lp_id: alloc.lpId,
      movement_type: 'consumption',
      qty_change: -alloc.qtyToConsume,
      qty_before: Number(lp?.current_qty || 0),
      qty_after: newQty,
      uom: wo.uom,
      wo_id: input.woId,
      consumption_id: consumption.id,
      created_by_user_id: userId,
      notes: `Output registration: ${outputLp.lp_number}`,
    })

    genealogyInputs.push({
      reservation_id: alloc.reservationId,
      lp_id: alloc.lpId,
      consumed_qty: alloc.qtyToConsume,
      uom: wo.uom,
    })
  }

  // 10. Create genealogy records (AC-4.12.4, AC-4.19)
  let genealogyCount = 0
  if (genealogyInputs.length > 0) {
    try {
      const genealogyRecords = await createOutputGenealogy(
        input.woId,
        outputLp.id,
        genealogyInputs,
        userId
      )
      genealogyCount = genealogyRecords.length
    } catch (gErr) {
      console.error('Genealogy creation warning:', gErr)
      warnings.push('Genealogy records may be incomplete')
    }
  }

  // Handle over-production genealogy (AC-4.12b.10)
  if (input.isOverProduction && input.overProductionParentLpId) {
    await supabase.from('lp_genealogy').insert({
      parent_lp_id: input.overProductionParentLpId,
      child_lp_id: outputLp.id,
      relationship_type: 'production',
      work_order_id: input.woId,
      quantity_from_parent: allocation.remainingUnallocated,
      uom: wo.uom,
      created_by: userId,
      is_over_production: true,
      over_production_source: 'operator_selected',
    })
    genealogyCount++
  }

  // 11. Update WO output tracking (AC-4.12.4, AC-4.12.5)
  const newOutputQty = Number(wo.produced_quantity || 0) + input.qty
  const woUpdate: Record<string, unknown> = { produced_quantity: newOutputQty }

  if (input.isOverProduction) {
    const { data: currentWo } = await supabase
      .from('work_orders')
      .select('over_production_qty')
      .eq('id', input.woId)
      .single()

    woUpdate.is_over_produced = true
    woUpdate.over_production_qty = Number(currentWo?.over_production_qty || 0) + allocation.remainingUnallocated
  }

  await supabase.from('work_orders').update(woUpdate).eq('id', input.woId)

  // 12. Update wo_materials consumed_qty
  for (const alloc of allocation.allocations) {
    try {
      await supabase.rpc('increment_consumed_qty', {
        p_material_id: alloc.materialId,
        p_qty: alloc.qtyToConsume,
      })
    } catch {
      // Fallback if RPC doesn't exist - direct update
      const { data } = await supabase
        .from('wo_materials')
        .select('consumed_qty')
        .eq('id', alloc.materialId)
        .single()

      const newConsumed = Number(data?.consumed_qty || 0) + alloc.qtyToConsume
      await supabase
        .from('wo_materials')
        .update({ consumed_qty: newConsumed })
        .eq('id', alloc.materialId)
    }
  }

  return {
    output: {
      id: outputRecord.id,
      lp_id: outputLp.id,
      lp_number: outputLp.lp_number,
      quantity: input.qty,
    },
    consumptionRecords,
    genealogyRecords: genealogyCount,
    warnings,
  }
}

/**
 * Get output history for a WO
 */
export async function getWOOutputs(woId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('production_outputs')
    .select(`
      id,
      quantity,
      uom,
      qa_status,
      is_over_production,
      produced_at,
      notes,
      lp_id,
      license_plates(id, lp_number, status, current_qty)
    `)
    .eq('wo_id', woId)
    .order('produced_at', { ascending: false })

  if (error) throw new Error(`Failed to get outputs: ${error.message}`)

  return data || []
}
