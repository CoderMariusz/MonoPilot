import { createServerSupabase } from '../supabase/server'

/**
 * Costing Service
 * Story: 2.51, 2.52, 2.53
 * Related: ADR-009-routing-level-costs
 *
 * Provides complete BOM cost calculation including:
 * - Material costs (from bom_items)
 * - Labor costs (from routing_operations)
 * - Setup costs (from routing)
 * - Working costs (from routing per unit)
 * - Overhead costs (percentage on subtotal)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BOMCostBreakdown {
  materialCost: number
  laborCost: number
  setupCost: number
  workingCost: number
  overheadCost: number
  totalCost: number
  currency: string
  calculatedAt: Date
  breakdown: {
    materials: MaterialCostLine[]
    operations: OperationCostLine[]
  }
}

export interface MaterialCostLine {
  productId: string
  productCode: string
  productName: string
  quantity: number
  scrapPercent?: number
  effectiveQuantity?: number
  unitCost: number
  lineCost: number
  uom: string
}

export interface OperationCostLine {
  operationId: string
  operationName: string
  sequence: number
  duration: number // minutes
  setupTime: number // minutes
  cleanupTime: number // minutes
  laborRate: number // per hour
  laborCost: number
}

export interface CostCalculationError {
  code: 'BOM_NOT_FOUND' | 'NO_ROUTING' | 'DATABASE_ERROR'
  message: string
}

export type CostCalculationResult =
  | { success: true; data: BOMCostBreakdown }
  | { success: false; error: CostCalculationError }

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Round to 2 decimal places for currency
 */
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Calculate total BOM cost including materials, labor, setup, working, and overhead
 * Formula from PRD Section 5.6 + ADR-009:
 *
 * Total Cost = Material + Labor + Setup + Working + Overhead
 *
 * Where:
 * - Material = SUM(bom_item.quantity * product.cost_per_unit)
 * - Labor = SUM((op.duration + op.setup_time + op.cleanup_time) / 60 * op.labor_cost_per_hour)
 * - Setup = routing.setup_cost (fixed per batch)
 * - Working = routing.working_cost_per_unit * quantity
 * - Overhead = (Material + Labor + Setup + Working) * routing.overhead_percent / 100
 *
 * @param bomId - UUID of the BOM to calculate cost for
 * @param quantity - Number of output units (default: 1)
 * @returns BOMCostBreakdown with detailed cost breakdown
 */
export async function calculateTotalBOMCost(
  bomId: string,
  quantity: number = 1
): Promise<CostCalculationResult> {
  try {
    const supabase = await createServerSupabase()

    // 1. Get BOM with items and routing
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select(`
        id,
        product_id,
        routing_id,
        output_qty,
        routing:routings (
          id,
          name,
          setup_cost,
          working_cost_per_unit,
          overhead_percent,
          currency
        ),
        items:bom_items (
          id,
          quantity,
          scrap_percent,
          product:products!component_id (
            id,
            code,
            name,
            cost_per_unit,
            uom
          )
        )
      `)
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      return {
        success: false,
        error: {
          code: 'BOM_NOT_FOUND',
          message: `BOM with id ${bomId} not found`
        }
      }
    }

    // 2. Calculate material cost
    const materialBreakdown: MaterialCostLine[] = (bom.items || []).map((item: any) => {
      const product = item.product
      const unitCost = product?.cost_per_unit || 0
      const scrapPercent = item.scrap_percent || 0
      const effectiveQty = item.quantity * (1 + scrapPercent / 100)
      const lineCost = roundCurrency(effectiveQty * unitCost)

      return {
        productId: product?.id || '',
        productCode: product?.code || '',
        productName: product?.name || '',
        quantity: item.quantity,
        scrapPercent: scrapPercent,
        effectiveQuantity: effectiveQty,
        unitCost: unitCost,
        lineCost: lineCost,
        uom: product?.uom || ''
      }
    })

    const materialCost = roundCurrency(
      materialBreakdown.reduce((sum, item) => sum + item.lineCost, 0)
    )

    // 3. Calculate labor cost from routing operations
    let laborCost = 0
    let setupCost = 0
    let workingCost = 0
    let overheadCost = 0
    let operationBreakdown: OperationCostLine[] = []
    let currency = 'PLN'

    const routing = bom.routing as any

    if (routing && bom.routing_id) {
      // Get routing operations with cleanup_time
      const { data: operations, error: opsError } = await supabase
        .from('routing_operations')
        .select('id, sequence, name, estimated_duration_minutes, labor_cost_per_hour, cleanup_time')
        .eq('routing_id', bom.routing_id)
        .order('sequence', { ascending: true })

      if (!opsError && operations) {
        operationBreakdown = operations.map((op: any) => {
          const duration = op.estimated_duration_minutes || 0
          const setupTime = 0 // Setup time is at operation level in some systems, here it's at routing level
          const cleanupTime = op.cleanup_time || 0
          const laborRate = op.labor_cost_per_hour || 0

          // Total time = duration + cleanup (setup is routing-level)
          const totalMinutes = duration + cleanupTime
          const opLaborCost = roundCurrency((totalMinutes / 60) * laborRate)

          return {
            operationId: op.id,
            operationName: op.name,
            sequence: op.sequence,
            duration: duration,
            setupTime: setupTime,
            cleanupTime: cleanupTime,
            laborRate: laborRate,
            laborCost: opLaborCost
          }
        })

        laborCost = roundCurrency(
          operationBreakdown.reduce((sum, op) => sum + op.laborCost, 0)
        )
      }

      // Routing-level costs (ADR-009)
      setupCost = roundCurrency(routing.setup_cost || 0)
      workingCost = roundCurrency((routing.working_cost_per_unit || 0) * quantity)
      currency = routing.currency || 'PLN'

      // Overhead calculation
      const subtotal = materialCost + laborCost + setupCost + workingCost
      const overheadPercent = routing.overhead_percent || 0
      overheadCost = roundCurrency((subtotal * overheadPercent) / 100)
    }

    // 4. Calculate total cost
    const totalCost = roundCurrency(
      materialCost + laborCost + setupCost + workingCost + overheadCost
    )

    return {
      success: true,
      data: {
        materialCost,
        laborCost,
        setupCost,
        workingCost,
        overheadCost,
        totalCost,
        currency,
        calculatedAt: new Date(),
        breakdown: {
          materials: materialBreakdown,
          operations: operationBreakdown
        }
      }
    }
  } catch (error) {
    console.error('Error calculating BOM cost:', error)
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown database error'
      }
    }
  }
}

/**
 * Calculate cost per output unit
 * Useful for pricing and margin calculations
 */
export async function calculateUnitCost(
  bomId: string
): Promise<{ success: true; unitCost: number; currency: string } | { success: false; error: CostCalculationError }> {
  const result = await calculateTotalBOMCost(bomId, 1)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // Get BOM output quantity
  const supabase = await createServerSupabase()
  const { data: bom } = await supabase
    .from('boms')
    .select('output_qty')
    .eq('id', bomId)
    .single()

  const outputQty = bom?.output_qty || 1
  const unitCost = roundCurrency(result.data.totalCost / outputQty)

  return {
    success: true,
    unitCost,
    currency: result.data.currency
  }
}

/**
 * Compare costs between two BOMs
 * Useful for version comparison and cost optimization
 */
export async function compareBOMCosts(
  bomId1: string,
  bomId2: string,
  quantity: number = 1
): Promise<{
  bom1: BOMCostBreakdown | null
  bom2: BOMCostBreakdown | null
  difference: {
    materialCost: number
    laborCost: number
    setupCost: number
    workingCost: number
    overheadCost: number
    totalCost: number
    percentChange: number
  } | null
}> {
  const [result1, result2] = await Promise.all([
    calculateTotalBOMCost(bomId1, quantity),
    calculateTotalBOMCost(bomId2, quantity)
  ])

  const bom1 = result1.success ? result1.data : null
  const bom2 = result2.success ? result2.data : null

  if (!bom1 || !bom2) {
    return { bom1, bom2, difference: null }
  }

  const difference = {
    materialCost: roundCurrency(bom2.materialCost - bom1.materialCost),
    laborCost: roundCurrency(bom2.laborCost - bom1.laborCost),
    setupCost: roundCurrency(bom2.setupCost - bom1.setupCost),
    workingCost: roundCurrency(bom2.workingCost - bom1.workingCost),
    overheadCost: roundCurrency(bom2.overheadCost - bom1.overheadCost),
    totalCost: roundCurrency(bom2.totalCost - bom1.totalCost),
    percentChange: bom1.totalCost > 0
      ? roundCurrency(((bom2.totalCost - bom1.totalCost) / bom1.totalCost) * 100)
      : 0
  }

  return { bom1, bom2, difference }
}
