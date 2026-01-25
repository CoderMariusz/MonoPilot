/**
 * By-Product Registration Service
 * Story 4.14: By-Product Registration
 */

import { createAdminClient } from '../supabase/admin-client'

export const BYPRODUCT_ERROR_CODES = {
  WO_NOT_IN_PROGRESS: 'WO_NOT_IN_PROGRESS',
  INVALID_QTY: 'INVALID_QTY',
  BYPRODUCT_NOT_FOUND: 'BYPRODUCT_NOT_FOUND',
  LP_CREATION_FAILED: 'LP_CREATION_FAILED',
} as const

export interface ByProductInput {
  woId: string
  byProductMaterialId: string
  qty: number
  qaStatus?: 'passed' | 'hold' | 'rejected' | 'pending'
  locationId?: string
  notes?: string
  mainOutputId?: string // Reference to main output that triggered this
}

export interface ByProductInfo {
  id: string
  productId: string
  productCode: string
  productName: string
  yieldPercent: number
  expectedQty: number
  registeredQty: number
  uom: string
}

export interface ByProductRegistrationResult {
  output: {
    id: string
    lpId: string
    lpNumber: string
    quantity: number
  }
  genealogyRecords: number
  warnings: string[]
}

/**
 * Get all by-products for a work order (AC-4.14.1)
 */
export async function getWOByProducts(woId: string): Promise<ByProductInfo[]> {
  const supabase = createAdminClient()

  // Get WO info for expected qty calculation
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('produced_quantity, planned_quantity')
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    return []
  }

  // Get by-products from wo_materials
  const { data: byProducts, error: bpError } = await supabase
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

  if (bpError || !byProducts) {
    return []
  }

  // Calculate expected qty for each by-product based on latest main output
  const lastOutputQty = wo.produced_quantity || 0

  return byProducts.map(bp => ({
    id: bp.id,
    productId: bp.product_id,
    productCode: bp.product_code,
    productName: bp.product_name,
    yieldPercent: bp.yield_percent || 0,
    expectedQty: lastOutputQty * (bp.yield_percent || 0) / 100,
    registeredQty: bp.by_product_registered_qty || 0,
    uom: bp.uom,
  }))
}

/**
 * Register a by-product output (AC-4.14.3, AC-4.14.4)
 * Manual entry - no sequential consumption
 */
export async function registerByProduct(
  input: ByProductInput,
  userId: string,
  orgId: string
): Promise<ByProductRegistrationResult> {
  const supabase = createAdminClient()
  const warnings: string[] = []

  // 1. Validate WO status
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, status, wo_number, production_line_id')
    .eq('id', input.woId)
    .single()

  if (woError || !wo) {
    throw { code: BYPRODUCT_ERROR_CODES.WO_NOT_IN_PROGRESS, message: 'Work order not found' }
  }

  if (wo.status !== 'in_progress') {
    throw { code: BYPRODUCT_ERROR_CODES.WO_NOT_IN_PROGRESS, message: 'WO not in progress' }
  }

  // 2. Validate qty
  if (input.qty <= 0) {
    throw { code: BYPRODUCT_ERROR_CODES.INVALID_QTY, message: 'By-product quantity must be > 0' }
  }

  // 3. Get by-product material info
  const { data: byProductMaterial, error: bpError } = await supabase
    .from('wo_materials')
    .select(`
      id,
      product_id,
      product_code,
      product_name,
      uom,
      is_by_product,
      yield_percent
    `)
    .eq('id', input.byProductMaterialId)
    .eq('work_order_id', input.woId)
    .single()

  if (bpError || !byProductMaterial) {
    throw { code: BYPRODUCT_ERROR_CODES.BYPRODUCT_NOT_FOUND, message: 'By-product not found in WO' }
  }

  if (!byProductMaterial.is_by_product) {
    throw { code: BYPRODUCT_ERROR_CODES.BYPRODUCT_NOT_FOUND, message: 'Material is not a by-product' }
  }

  // 4. Get product info for LP creation
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('id, name, uom, shelf_life_days')
    .eq('id', byProductMaterial.product_id)
    .single()

  if (prodError || !product) {
    throw { code: BYPRODUCT_ERROR_CODES.LP_CREATION_FAILED, message: 'Product not found' }
  }

  // 5. Get production line for default location
  let outputLocationId = input.locationId
  if (!outputLocationId && wo.production_line_id) {
    const { data: line } = await supabase
      .from('production_lines')
      .select('default_output_location_id')
      .eq('id', wo.production_line_id)
      .single()
    outputLocationId = line?.default_output_location_id || undefined
  }

  // 6. Create by-product LP (AC-4.14.4)
  const expiryDate = product.shelf_life_days
    ? new Date(Date.now() + product.shelf_life_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null

  // Generate LP number with BP prefix
  const lpNumber = `BP-${wo.wo_number}-${Date.now().toString(36).toUpperCase()}`

  const { data: byProductLp, error: lpError } = await supabase
    .from('license_plates')
    .insert({
      org_id: orgId,
      lp_number: lpNumber,
      product_id: byProductMaterial.product_id,
      quantity: input.qty,
      current_qty: input.qty,
      uom: byProductMaterial.uom,
      status: 'available',
      qa_status: input.qaStatus || 'passed',
      location_id: outputLocationId,
      expiry_date: expiryDate,
      manufacturing_date: new Date().toISOString().split('T')[0],
      created_by: userId,
    })
    .select()
    .single()

  if (lpError || !byProductLp) {
    throw { code: BYPRODUCT_ERROR_CODES.LP_CREATION_FAILED, message: `Failed to create LP: ${lpError?.message}` }
  }

  // 7. Create production_outputs record for by-product
  const { data: outputRecord, error: outputError } = await supabase
    .from('production_outputs')
    .insert({
      wo_id: input.woId,
      organization_id: orgId,
      product_id: byProductMaterial.product_id,
      lp_id: byProductLp.id,
      quantity: input.qty,
      uom: byProductMaterial.uom,
      qa_status: input.qaStatus,
      location_id: outputLocationId,
      is_by_product: true,
      by_product_material_id: input.byProductMaterialId,
      main_output_id: input.mainOutputId,
      produced_by_user_id: userId,
      produced_at: new Date().toISOString(),
      notes: input.notes,
    })
    .select()
    .single()

  if (outputError || !outputRecord) {
    // Rollback LP
    await supabase.from('license_plates').delete().eq('id', byProductLp.id)
    throw { code: BYPRODUCT_ERROR_CODES.LP_CREATION_FAILED, message: `Failed to create output: ${outputError?.message}` }
  }

  // 8. Update wo_materials registered qty
  const { data: currentMaterial } = await supabase
    .from('wo_materials')
    .select('by_product_registered_qty')
    .eq('id', input.byProductMaterialId)
    .single()

  const newRegisteredQty = (currentMaterial?.by_product_registered_qty || 0) + input.qty

  await supabase
    .from('wo_materials')
    .update({ by_product_registered_qty: newRegisteredQty })
    .eq('id', input.byProductMaterialId)

  // 9. Create genealogy records linking to same parent LPs as main output (AC-4.14.5)
  let genealogyCount = 0

  if (input.mainOutputId) {
    // Get parent LPs from main output's genealogy
    const { data: mainGenealogy } = await supabase
      .from('lp_genealogy')
      .select('parent_lp_id, quantity_from_parent, uom')
      .eq('child_lp_id', (await supabase
        .from('production_outputs')
        .select('lp_id')
        .eq('id', input.mainOutputId)
        .single()).data?.lp_id)

    if (mainGenealogy && mainGenealogy.length > 0) {
      // Create genealogy for by-product to same parent LPs (Option A: link to all)
      for (const parentLink of mainGenealogy) {
        const { error: geneError } = await supabase
          .from('lp_genealogy')
          .insert({
            parent_lp_id: parentLink.parent_lp_id,
            child_lp_id: byProductLp.id,
            relationship_type: 'by_product',
            work_order_id: input.woId,
            quantity_from_parent: input.qty / mainGenealogy.length, // Distribute evenly
            uom: byProductMaterial.uom,
            created_by: userId,
          })

        if (!geneError) {
          genealogyCount++
        }
      }
    }
  }

  return {
    output: {
      id: outputRecord.id,
      lpId: byProductLp.id,
      lpNumber: byProductLp.lp_number,
      quantity: input.qty,
    },
    genealogyRecords: genealogyCount,
    warnings,
  }
}

/**
 * Get by-products that still need registration after main output
 */
export async function getPendingByProducts(
  woId: string,
  mainOutputQty: number
): Promise<ByProductInfo[]> {
  const byProducts = await getWOByProducts(woId)

  // Filter to those that haven't been registered for this output
  // (Simple approach: show all by-products, let operator decide)
  return byProducts.map(bp => ({
    ...bp,
    expectedQty: mainOutputQty * bp.yieldPercent / 100,
  }))
}

// ============================================================================
// Story 04.7a - Additional By-Product Functions
// ============================================================================

/**
 * Calculate expected by-product quantity
 * Formula: plannedQty * yieldPercent / 100
 *
 * @param plannedQty - Planned quantity of main product
 * @param yieldPercent - By-product yield percentage
 * @returns Expected by-product quantity, rounded to 1 decimal
 */
export function calculateExpectedQty(
  plannedQty: number,
  yieldPercent: number
): number {
  const expected = (plannedQty * yieldPercent) / 100
  // Round to 1 decimal place
  return Math.round(expected * 10) / 10
}

/**
 * Calculate expected by-product quantity (Story 04.7c)
 * Alias without rounding for precise calculations
 *
 * @param plannedQty - Planned quantity of main product
 * @param yieldPercent - By-product yield percentage
 * @returns Expected by-product quantity (no rounding)
 */
export function calculateExpectedByProductQty(
  plannedQty: number,
  yieldPercent: number
): number {
  return (plannedQty * yieldPercent) / 100
}

/**
 * Generate by-product batch number
 * Format: {mainBatch}-BP-{productCode}
 *
 * @param mainBatch - Main output batch number
 * @param productCode - By-product product code
 * @returns Generated batch number
 */
export function generateByProductBatch(
  mainBatch: string,
  productCode: string
): string {
  // Handle empty product code
  if (!productCode) {
    return `${mainBatch}-BP`
  }

  // Sanitize product code - replace special characters (except hyphen/underscore) with dash
  const sanitizedCode = productCode.replace(/[^a-zA-Z0-9_-]/g, '-')

  // Generate batch number
  const batchNumber = `${mainBatch}-BP-${sanitizedCode}`

  // Truncate to max 50 characters if needed
  if (batchNumber.length > 50) {
    return batchNumber.slice(0, 50)
  }

  return batchNumber
}
