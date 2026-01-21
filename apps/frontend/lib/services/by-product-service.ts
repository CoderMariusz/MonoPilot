/**
 * By-Product Service (Story 04.7a, 04.7c)
 *
 * Re-exports from byproduct-service.ts for consistent naming
 * Plus additional functions for Story 04.7c
 */

export {
  BYPRODUCT_ERROR_CODES,
  type ByProductInput,
  type ByProductInfo,
  type ByProductRegistrationResult,
  getWOByProducts,
  registerByProduct as registerByProductLegacy,
  getPendingByProducts,
  calculateExpectedQty,
  generateByProductBatch,
} from './byproduct-service'

import { generateByProductBatch } from './byproduct-service'
import { createAdminClient } from '../supabase/admin-client'
import type { RegisterByProductInput, ByProductStatus } from '../validation/by-product-schemas'

// ============================================================================
// Story 04.7c - By-Product Registration Extended Functions
// ============================================================================

/**
 * Calculate expected by-product quantity
 * Formula: plannedQty * yieldPercent / 100
 *
 * AC: GIVEN WO.planned_qty = 1000 AND by-product yield_percent = 5
 * WHEN by-product prompt displays
 * THEN expected qty shows as 50
 *
 * @param plannedQty - Planned quantity of main product
 * @param yieldPercent - By-product yield percentage
 * @returns Expected by-product quantity
 */
export function calculateExpectedByProductQty(
  plannedQty: number,
  yieldPercent: number
): number {
  return (plannedQty * yieldPercent) / 100
}

/**
 * By-Product Registration Result interface for 04.7c
 */
export interface ByProductRegistrationResult04_7c {
  success: boolean
  lp: {
    id: string
    lp_number: string
    quantity: number
    is_by_product: boolean
    location_id?: string
    expiry_date?: string
  }
  genealogy: Array<{
    parent_lp_id: string
    child_lp_id: string
    quantity_from_parent: number
  }>
  output_record: {
    id: string
    is_by_product: boolean
    parent_output_id?: string
    by_product_material_id: string
  }
  message: string
}

/**
 * Register a by-product with full 04.7c functionality
 * Creates LP, production_output, and genealogy records
 *
 * AC: Creates LP with is_by_product = true
 * AC: Copies genealogy from main output to by-product LP
 * AC: Creates production_output with is_by_product = true
 */
export async function registerByProduct(
  request: RegisterByProductInput & { parent_output_id?: string }
): Promise<ByProductRegistrationResult04_7c> {
  const supabase = createAdminClient()

  // 1. Validate that the material is a by-product
  const { data: material, error: matError } = await supabase
    .from('wo_materials')
    .select('id, product_id, is_by_product, yield_percent, uom, product_code')
    .eq('id', request.by_product_material_id)
    .single()

  if (matError || !material) {
    throw new Error('By-product material not found')
  }

  if (!material.is_by_product) {
    throw new Error('Material is not a by-product')
  }

  // 2. Get product info for shelf life
  const { data: product } = await supabase
    .from('products')
    .select('id, shelf_life_days, default_location_id')
    .eq('id', material.product_id)
    .single()

  // 3. Calculate expiry date from shelf_life_days
  let expiryDate: string | undefined = request.expiry_date
  if (!expiryDate && product?.shelf_life_days) {
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + product.shelf_life_days)
    expiryDate = expiry.toISOString().split('T')[0]
  }

  // 4. Determine location (use default if not specified)
  let locationId = request.location_id
  if (!locationId && product?.default_location_id) {
    locationId = product.default_location_id
  }

  // 5. Get org_id from WO
  const { data: wo } = await supabase
    .from('work_orders')
    .select('org_id, wo_number')
    .eq('id', request.wo_id)
    .single()

  if (!wo) {
    throw new Error('Work order not found')
  }

  // 6. Generate batch number if not provided
  const batchNumber = request.batch_number ||
    generateByProductBatch(wo.wo_number, material.product_code || '')

  // 7. Create License Plate with is_by_product = true
  const lpNumber = `BP-${wo.wo_number}-${Date.now().toString(36).toUpperCase()}`

  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .insert({
      org_id: wo.org_id,
      lp_number: lpNumber,
      product_id: material.product_id,
      quantity: request.quantity,
      current_qty: request.quantity,
      uom: request.uom,
      batch_number: batchNumber,
      status: 'available',
      qa_status: request.qa_status || 'pending',
      location_id: locationId,
      expiry_date: expiryDate,
      is_by_product: true,
      wo_id: request.wo_id,
      manufacturing_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (lpError || !lp) {
    throw new Error(`Failed to create LP: ${lpError?.message}`)
  }

  // 8. Create production_outputs record
  const { data: outputRecord, error: outputError } = await supabase
    .from('production_outputs')
    .insert({
      wo_id: request.wo_id,
      organization_id: wo.org_id,
      product_id: material.product_id,
      lp_id: lp.id,
      quantity: request.quantity,
      uom: request.uom,
      qa_status: request.qa_status,
      location_id: locationId,
      is_by_product: true,
      by_product_material_id: request.by_product_material_id,
      parent_output_id: request.parent_output_id,
      produced_at: new Date().toISOString(),
      notes: request.notes,
    })
    .select()
    .single()

  if (outputError || !outputRecord) {
    // Rollback LP creation
    await supabase.from('license_plates').delete().eq('id', lp.id)
    throw new Error(`Failed to create output record: ${outputError?.message}`)
  }

  // 9. Copy genealogy from main output LP
  const genealogyRecords: Array<{
    parent_lp_id: string
    child_lp_id: string
    quantity_from_parent: number
  }> = []

  const { data: mainGenealogy } = await supabase
    .from('lp_genealogy')
    .select('parent_lp_id, quantity_from_parent, uom')
    .eq('child_lp_id', request.main_output_lp_id)

  if (mainGenealogy && mainGenealogy.length > 0) {
    for (const parentLink of mainGenealogy) {
      const { error: geneError } = await supabase
        .from('lp_genealogy')
        .insert({
          parent_lp_id: parentLink.parent_lp_id,
          child_lp_id: lp.id,
          relationship_type: 'by_product',
          work_order_id: request.wo_id,
          quantity_from_parent: request.quantity / mainGenealogy.length,
          uom: request.uom,
        })

      if (!geneError) {
        genealogyRecords.push({
          parent_lp_id: parentLink.parent_lp_id,
          child_lp_id: lp.id,
          quantity_from_parent: request.quantity / mainGenealogy.length,
        })
      }
    }
  }

  // 10. Update wo_materials.by_product_registered_qty
  const { data: currentMaterial } = await supabase
    .from('wo_materials')
    .select('by_product_registered_qty')
    .eq('id', request.by_product_material_id)
    .single()

  const newRegisteredQty = (currentMaterial?.by_product_registered_qty || 0) + request.quantity
  await supabase
    .from('wo_materials')
    .update({ by_product_registered_qty: newRegisteredQty })
    .eq('id', request.by_product_material_id)

  return {
    success: true,
    lp: {
      id: lp.id,
      lp_number: lp.lp_number,
      quantity: request.quantity,
      is_by_product: true,
      location_id: locationId,
      expiry_date: expiryDate,
    },
    genealogy: genealogyRecords,
    output_record: {
      id: outputRecord.id,
      is_by_product: true,
      parent_output_id: request.parent_output_id,
      by_product_material_id: request.by_product_material_id,
    },
    message: `By-product LP ${lp.lp_number} created successfully`,
  }
}

/**
 * Auto-create by-product LPs when main output is registered
 *
 * AC: GIVEN auto_create_by_product_lp = true
 * WHEN main output registered
 * THEN by-product LPs auto-created with expected quantities
 */
export async function autoCreateByProducts(
  woId: string,
  mainOutputLpId: string,
  parentOutputId: string,
  byProductMaterialIds: string[]
): Promise<ByProductRegistrationResult04_7c[]> {
  if (byProductMaterialIds.length === 0) {
    return []
  }

  const supabase = createAdminClient()
  const results: ByProductRegistrationResult04_7c[] = []

  // Get WO info for expected qty calculation
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, planned_quantity, output_qty, org_id')
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new Error('Work order not found')
  }

  // Get production line default location
  const { data: woDetails } = await supabase
    .from('work_orders')
    .select('production_line_id, production_lines(default_output_location_id)')
    .eq('id', woId)
    .single()

  const defaultLocationId = (woDetails?.production_lines as { default_output_location_id?: string } | null)?.default_output_location_id

  // Process each by-product material
  for (const materialId of byProductMaterialIds) {
    const { data: material } = await supabase
      .from('wo_materials')
      .select('id, product_id, yield_percent, uom, is_by_product')
      .eq('id', materialId)
      .single()

    if (!material || !material.is_by_product) {
      continue
    }

    // Calculate expected qty
    const expectedQty = calculateExpectedByProductQty(
      wo.planned_quantity || 0,
      material.yield_percent || 0
    )

    try {
      const result = await registerByProduct({
        wo_id: woId,
        main_output_lp_id: mainOutputLpId,
        by_product_id: material.product_id,
        by_product_material_id: materialId,
        quantity: expectedQty,
        uom: material.uom || 'kg',
        location_id: defaultLocationId || '',
        parent_output_id: parentOutputId,
      })

      results.push(result)
    } catch (error) {
      console.error(`Failed to auto-create by-product for material ${materialId}:`, error)
    }
  }

  return results
}

/**
 * Get by-products status for a work order
 *
 * AC: Returns all by-products with calculated expected qty
 * AC: Aggregates LP counts correctly
 * AC: Returns status = registered when any LP exists
 */
export async function getByProductsForWO(woId: string): Promise<ByProductStatus[]> {
  const supabase = createAdminClient()

  // Get WO info
  const { data: wo } = await supabase
    .from('work_orders')
    .select('id, planned_quantity, output_qty')
    .eq('id', woId)
    .single()

  if (!wo) {
    return []
  }

  // Get by-product materials
  const { data: materials } = await supabase
    .from('wo_materials')
    .select(`
      id,
      product_id,
      product_code,
      product_name,
      yield_percent,
      by_product_registered_qty,
      uom
    `)
    .eq('work_order_id', woId)
    .eq('is_by_product', true)
    .order('line_number')

  if (!materials || materials.length === 0) {
    return []
  }

  // Get LP counts and last registration dates
  const results: ByProductStatus[] = []

  for (const material of materials) {
    // Count LPs for this by-product
    const { count: lpCount } = await supabase
      .from('production_outputs')
      .select('id', { count: 'exact', head: true })
      .eq('wo_id', woId)
      .eq('by_product_material_id', material.id)
      .eq('is_by_product', true)

    // Get last registration date
    const { data: lastOutput } = await supabase
      .from('production_outputs')
      .select('produced_at')
      .eq('wo_id', woId)
      .eq('by_product_material_id', material.id)
      .eq('is_by_product', true)
      .order('produced_at', { ascending: false })
      .limit(1)
      .single()

    // Calculate expected qty based on output_qty (current output)
    const expectedQty = calculateExpectedByProductQty(
      wo.output_qty || 0,
      material.yield_percent || 0
    )

    results.push({
      product_id: material.product_id,
      product_name: material.product_name,
      product_code: material.product_code,
      material_id: material.id,
      yield_percent: material.yield_percent || 0,
      expected_qty: expectedQty,
      actual_qty: material.by_product_registered_qty || 0,
      uom: material.uom || 'kg',
      lp_count: lpCount || 0,
      status: (material.by_product_registered_qty || 0) > 0 ? 'registered' : 'not_registered',
      last_registered_at: lastOutput?.produced_at || null,
    })
  }

  return results
}

