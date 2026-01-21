/**
 * Output Service for Story 04.7a - Output Registration Desktop
 *
 * Business logic for output registration:
 * - getOutputPageData() - Fetch WO summary, yields, outputs, by-products
 * - registerOutput() - Create LP, genealogy, update WO progress
 * - exportOutputsCSV() - Export outputs to CSV
 * - calculateExpiryDate() - Shelf life calculation
 * - generateBatchNumber() - Batch number generation
 *
 * Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-011 to FR-PROD-015)
 */

import { createAdminClient } from '../supabase/admin-client'
import {
  calculateOutputYield,
  calculateMaterialYield,
  getYieldColor,
} from './yield-service'
import type { RegisterOutputInput } from '../validation/output-schemas'

// ============================================================================
// Types
// ============================================================================

export interface WorkOrderSummary {
  id: string
  wo_number: string
  status: string
  product_id: string
  product_name: string
  product_code: string
  batch_number: string
  planned_qty: number
  output_qty: number
  uom: string
  progress_percent: number
  remaining_qty: number
  default_location_id: string | null
  default_location_name: string | null
}

export interface YieldData {
  overall_yield: number | null
  output_yield: number | null
  material_yield: number | null
  operation_yield: number | null
  output_trend: number | null
  target_yield: number
}

export interface OutputLP {
  id: string
  lp_number: string
  quantity: number
  uom: string
  batch_number: string
  qa_status: string | null
  location_id: string | null
  location_name: string | null
  expiry_date: string | null
  created_at: string
  created_by: string
}

export interface ByProduct {
  id: string
  product_id: string
  product_name: string
  product_code: string
  yield_percent: number
  expected_qty: number
  actual_qty: number
  uom: string
  status: 'pending' | 'registered'
}

export interface ProductionSettings {
  require_qa_on_output: boolean
  auto_create_by_product_lp: boolean
  allow_over_production: boolean
  default_yield_target: number
}

export interface OutputPageData {
  wo: WorkOrderSummary
  yields: YieldData
  outputs: OutputLP[]
  by_products: ByProduct[]
  settings: ProductionSettings
}

export interface RegisterOutputResponse {
  lp: {
    id: string
    lp_number: string
    quantity: number
    source: string
    wo_id: string
    qa_status: string | null
    batch_number: string
    expiry_date: string | null
  }
  genealogy: {
    parent_lps: { lp_id: string; lp_number: string; qty_consumed: number }[]
    child_lp_id: string
  }
  wo_updated: {
    output_qty: number
    progress_percent: number
    status: string
  }
  warnings: string[]
}

// ============================================================================
// Output Page Data
// ============================================================================

/**
 * Get all data needed for output registration page
 *
 * @param woId - Work order ID
 * @returns Output page data with WO summary, yields, outputs, by-products, settings
 */
export async function getOutputPageData(woId: string): Promise<OutputPageData> {
  const supabase = createAdminClient()

  // 1. Get work order with product info
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select(
      `
      id,
      wo_number,
      status,
      product_id,
      batch_number,
      planned_qty,
      output_qty,
      uom,
      production_line_id,
      products!inner(id, name, product_code, shelf_life_days)
    `
    )
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new Error('Work order not found')
  }

  // 2. Get production line for default location
  let defaultLocationId: string | null = null
  let defaultLocationName: string | null = null

  if (wo.production_line_id) {
    const { data: line } = await supabase
      .from('production_lines')
      .select('default_output_location_id, locations(id, name)')
      .eq('id', wo.production_line_id)
      .single()

    if (line?.default_output_location_id) {
      defaultLocationId = line.default_output_location_id
      const locations = line.locations as unknown as { id: string; name: string } | null
      defaultLocationName = locations?.name || null
    }
  }

  // 3. Calculate progress
  const plannedQty = Number(wo.planned_qty) || 0
  const outputQty = Number(wo.output_qty) || 0
  const progressPercent =
    plannedQty > 0 ? Math.round((outputQty / plannedQty) * 100 * 10) / 10 : 0
  const remainingQty = Math.max(0, plannedQty - outputQty)

  // 4. Get outputs
  const { data: outputs } = await supabase
    .from('license_plates')
    .select(
      `
      id,
      lp_number,
      quantity,
      uom,
      batch_number,
      qa_status,
      location_id,
      expiry_date,
      created_at,
      created_by,
      locations(id, name)
    `
    )
    .eq('wo_id', woId)
    .eq('source', 'production')
    .order('created_at', { ascending: false })

  // 5. Calculate yields
  const outputYield = calculateOutputYield(outputQty, plannedQty)

  // Get material consumption data for material yield
  const { data: consumptions } = await supabase
    .from('wo_consumption')
    .select('consumed_qty, wo_materials!inner(required_qty)')
    .eq('wo_id', woId)

  let materialYield: number | null = null
  if (consumptions && consumptions.length > 0) {
    const totalPlanned = consumptions.reduce((sum, c) => {
      const materials = c.wo_materials as unknown as { required_qty: number }
      return sum + (materials?.required_qty || 0)
    }, 0)
    const totalConsumed = consumptions.reduce(
      (sum, c) => sum + Number(c.consumed_qty),
      0
    )
    materialYield = calculateMaterialYield(totalPlanned, totalConsumed)
  }

  // Overall yield (average of available yields)
  const validYields = [outputYield, materialYield].filter(
    (y) => y !== null
  ) as number[]
  const overallYield =
    validYields.length > 0
      ? Math.round(
          (validYields.reduce((sum, y) => sum + y, 0) / validYields.length) * 10
        ) / 10
      : null

  // 6. Get by-products from BOM snapshot
  const { data: byProducts } = await supabase
    .from('wo_materials')
    .select(
      `
      id,
      product_id,
      product_name,
      product_code,
      yield_percent,
      by_product_registered_qty,
      uom
    `
    )
    .eq('work_order_id', woId)
    .eq('is_by_product', true)

  // 7. Get production settings
  const { data: wo2 } = await supabase
    .from('work_orders')
    .select('org_id')
    .eq('id', woId)
    .single()

  const { data: settings } = await supabase
    .from('production_settings')
    .select(
      'require_qa_on_output, auto_create_by_product_lp, allow_over_production, default_yield_target'
    )
    .eq('organization_id', wo2?.org_id || '')
    .single()

  // Build response
  const products = wo.products as unknown as {
    id: string
    name: string
    product_code: string
    shelf_life_days: number
  }

  const woSummary: WorkOrderSummary = {
    id: wo.id,
    wo_number: wo.wo_number,
    status: wo.status,
    product_id: wo.product_id,
    product_name: products?.name || '',
    product_code: products?.product_code || '',
    batch_number: wo.batch_number || wo.wo_number,
    planned_qty: plannedQty,
    output_qty: outputQty,
    uom: wo.uom,
    progress_percent: progressPercent,
    remaining_qty: remainingQty,
    default_location_id: defaultLocationId,
    default_location_name: defaultLocationName,
  }

  const yieldData: YieldData = {
    overall_yield: overallYield,
    output_yield: outputYield,
    material_yield: materialYield,
    operation_yield: null, // TODO: Calculate from operations
    output_trend: null, // TODO: Calculate trend
    target_yield: settings?.default_yield_target || 95,
  }

  const outputsList: OutputLP[] = (outputs || []).map((o) => {
    const loc = o.locations as unknown as { id: string; name: string } | null
    return {
      id: o.id,
      lp_number: o.lp_number,
      quantity: Number(o.quantity),
      uom: o.uom,
      batch_number: o.batch_number || '',
      qa_status: o.qa_status,
      location_id: o.location_id,
      location_name: loc?.name || null,
      expiry_date: o.expiry_date,
      created_at: o.created_at,
      created_by: o.created_by,
    }
  })

  const byProductsList: ByProduct[] = (byProducts || []).map((bp) => {
    const expectedQty = (plannedQty * (bp.yield_percent || 0)) / 100
    const actualQty = Number(bp.by_product_registered_qty) || 0
    return {
      id: bp.id,
      product_id: bp.product_id,
      product_name: bp.product_name || '',
      product_code: bp.product_code || '',
      yield_percent: bp.yield_percent || 0,
      expected_qty: Math.round(expectedQty * 10) / 10,
      actual_qty: actualQty,
      uom: bp.uom,
      status: actualQty > 0 ? 'registered' : 'pending',
    }
  })

  const productionSettings: ProductionSettings = {
    require_qa_on_output: settings?.require_qa_on_output ?? false,
    auto_create_by_product_lp: settings?.auto_create_by_product_lp ?? false,
    allow_over_production: settings?.allow_over_production ?? false,
    default_yield_target: settings?.default_yield_target || 95,
  }

  return {
    wo: woSummary,
    yields: yieldData,
    outputs: outputsList,
    by_products: byProductsList,
    settings: productionSettings,
  }
}

// ============================================================================
// Output Registration
// ============================================================================

/**
 * Register a production output
 *
 * @param input - Output registration input
 * @param userId - User ID
 * @param orgId - Organization ID
 * @returns Registration result with LP, genealogy, WO update
 */
export async function registerOutput(
  input: RegisterOutputInput & { wo_id: string },
  userId: string,
  orgId: string
): Promise<RegisterOutputResponse> {
  const supabase = createAdminClient()
  const warnings: string[] = []

  // 1. Validate WO
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, status, product_id, wo_number, uom, output_qty, batch_number')
    .eq('id', input.wo_id)
    .single()

  if (woError || !wo) {
    throw new Error('Work order not found')
  }

  if (wo.status !== 'in_progress') {
    throw new Error('WO not in progress')
  }

  // 2. Validate quantity
  if (input.quantity <= 0) {
    throw new Error('Quantity must be greater than 0')
  }

  // 3. Check QA requirement
  const { data: settings } = await supabase
    .from('production_settings')
    .select('require_qa_on_output')
    .eq('organization_id', orgId)
    .single()

  if (settings?.require_qa_on_output && !input.qa_status) {
    throw new Error('QA status is required')
  }

  // 4. Get product info
  const { data: product } = await supabase
    .from('products')
    .select('id, shelf_life_days')
    .eq('id', wo.product_id)
    .single()

  // 5. Calculate expiry date if not provided
  const expiryDate =
    input.expiry_date ||
    calculateExpiryDate(product?.shelf_life_days)
      .toISOString()
      .split('T')[0]

  // 6. Use batch number from input or WO
  const batchNumber = input.batch_number || wo.batch_number || wo.wo_number

  // 7. Generate LP number
  const lpNumber = `LP-${wo.wo_number}-${Date.now().toString(36).toUpperCase()}`

  // 8. Create LP
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .insert({
      org_id: orgId,
      lp_number: lpNumber,
      product_id: wo.product_id,
      quantity: input.quantity,
      current_qty: input.quantity,
      uom: input.uom,
      status: 'available',
      qa_status: input.qa_status || null,
      batch_number: batchNumber,
      location_id: input.location_id,
      expiry_date: expiryDate,
      manufacturing_date: new Date().toISOString().split('T')[0],
      source: 'production',
      wo_id: input.wo_id,
      created_by: userId,
    })
    .select()
    .single()

  if (lpError || !lp) {
    throw new Error(`Failed to create LP: ${lpError?.message}`)
  }

  // 9. Get consumed materials and create genealogy
  const { data: consumptions } = await supabase
    .from('wo_consumption')
    .select('lp_id, consumed_qty, license_plates!inner(lp_number)')
    .eq('wo_id', input.wo_id)
    .eq('status', 'consumed')

  const parentLps: { lp_id: string; lp_number: string; qty_consumed: number }[] =
    []

  if (consumptions && consumptions.length > 0) {
    for (const consumption of consumptions) {
      const lpInfo = consumption.license_plates as unknown as {
        lp_number: string
      }

      // Create genealogy record
      await supabase.from('lp_genealogy').insert({
        org_id: orgId,
        parent_lp_id: consumption.lp_id,
        child_lp_id: lp.id,
        operation_type: 'production',
        quantity: Number(consumption.consumed_qty),
        wo_id: input.wo_id,
        operation_date: new Date().toISOString(),
      })

      parentLps.push({
        lp_id: consumption.lp_id,
        lp_number: lpInfo?.lp_number || '',
        qty_consumed: Number(consumption.consumed_qty),
      })
    }
  } else {
    warnings.push('No consumed materials for genealogy')
  }

  // 10. Update WO output_qty and progress
  const newOutputQty = Number(wo.output_qty || 0) + input.quantity

  await supabase
    .from('work_orders')
    .update({
      output_qty: newOutputQty,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.wo_id)

  // Get planned_qty for progress calculation
  const { data: woFull } = await supabase
    .from('work_orders')
    .select('planned_qty, status')
    .eq('id', input.wo_id)
    .single()

  const plannedQty = Number(woFull?.planned_qty) || 0
  const progressPercent =
    plannedQty > 0 ? Math.round((newOutputQty / plannedQty) * 100) : 0

  return {
    lp: {
      id: lp.id,
      lp_number: lp.lp_number,
      quantity: Number(lp.quantity),
      source: lp.source,
      wo_id: lp.wo_id,
      qa_status: lp.qa_status,
      batch_number: lp.batch_number,
      expiry_date: lp.expiry_date,
    },
    genealogy: {
      parent_lps: parentLps,
      child_lp_id: lp.id,
    },
    wo_updated: {
      output_qty: newOutputQty,
      progress_percent: progressPercent,
      status: woFull?.status || wo.status,
    },
    warnings,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate expiry date from shelf life days
 *
 * @param shelfLifeDays - Product shelf life in days (defaults to 90)
 * @param baseDate - Base date for calculation (defaults to today)
 * @returns Expiry date
 */
export function calculateExpiryDate(
  shelfLifeDays?: number | null,
  baseDate?: Date
): Date {
  const days = shelfLifeDays ?? 90 // Default to 90 days
  const base = baseDate || new Date()
  const expiry = new Date(base)
  expiry.setDate(expiry.getDate() + days)
  return expiry
}

/**
 * Generate batch number
 *
 * @param wo - Work order info
 * @param productCode - Optional product code to include
 * @returns Generated batch number
 */
export function generateBatchNumber(
  wo: { id: string; wo_number: string; product_code?: string },
  productCode?: string
): string {
  if (productCode) {
    return `${wo.wo_number}-${productCode}`
  }
  return wo.wo_number
}

/**
 * Export outputs to CSV
 *
 * @param woId - Work order ID
 * @returns CSV blob
 */
export async function exportOutputsCSV(woId: string): Promise<Blob> {
  const supabase = createAdminClient()

  // Get outputs
  const { data: outputs, error } = await supabase
    .from('license_plates')
    .select(
      `
      lp_number,
      quantity,
      uom,
      batch_number,
      qa_status,
      location_id,
      expiry_date,
      created_at,
      locations(name)
    `
    )
    .eq('wo_id', woId)
    .eq('source', 'production')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch outputs: ${error.message}`)
  }

  // Build CSV
  const headers = [
    'LP Number',
    'Quantity',
    'UoM',
    'Batch',
    'QA Status',
    'Location',
    'Expiry Date',
    'Created At',
  ]

  const rows = (outputs || []).map((o) => {
    const loc = o.locations as unknown as { name: string } | null
    return [
      o.lp_number,
      o.quantity,
      o.uom,
      o.batch_number || '',
      o.qa_status || '',
      loc?.name || '',
      o.expiry_date || '',
      o.created_at,
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const str = String(cell)
          // Escape quotes and wrap in quotes if contains comma
          if (str.includes(',') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    ),
  ].join('\n')

  return new Blob([csvContent], { type: 'text/csv' })
}
