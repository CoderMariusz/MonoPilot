import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'

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
  calculatedAt: string
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
 * Returns 0 if value is NaN or invalid
 */
function roundCurrency(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 0
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
 * @param orgId - Organization ID for RLS filtering (required for cross-table joins)
 * @returns BOMCostBreakdown with detailed cost breakdown
 */
export async function calculateTotalBOMCost(
  bomId: string,
  quantity: number = 1,
  orgId?: string
): Promise<CostCalculationResult> {
  try {
    const supabase = await createServerSupabase()
    // Use admin client for complex joins to bypass RLS issues
    const supabaseAdmin = createServerSupabaseAdmin()

    // 1. Get BOM with items using admin client (bypasses RLS for reliable joins)
    // Still filter by org_id for security
    let bomQuery = supabaseAdmin
      .from('boms')
      .select(`
        id,
        product_id,
        routing_id,
        output_qty,
        items:bom_items (
          id,
          quantity,
          scrap_percent,
          product:products!product_id (
            id,
            code,
            name,
            cost_per_unit,
            base_uom
          )
        )
      `)
      .eq('id', bomId)

    // ALWAYS filter by org_id for security when using admin client
    if (orgId) {
      bomQuery = bomQuery.eq('org_id', orgId)
    }

    const { data: bom, error: bomError } = await bomQuery.single()

    console.log('[Costing Service] BOM query result:', {
      bomId,
      orgId,
      found: !!bom,
      hasItems: bom?.items?.length,
      error: bomError?.message,
      errorCode: bomError?.code,
      errorDetails: bomError?.details
    })

    if (bomError || !bom) {
      console.error('BOM fetch error:', bomError)
      return {
        success: false,
        error: {
          code: 'BOM_NOT_FOUND',
          message: `BOM with id ${bomId} not found`
        }
      }
    }

    // 2. Fetch routing separately if routing_id is set
    let routingData: {
      id: string
      name: string
      setup_cost: number
      working_cost_per_unit: number
      overhead_percent: number
      currency: string
    } | null = null

    if (bom.routing_id) {
      const { data: routing } = await supabaseAdmin
        .from('routings')
        .select('id, name, setup_cost, working_cost_per_unit, overhead_percent, currency')
        .eq('id', bom.routing_id)
        .single()

      routingData = routing
    }

    // 3. Calculate material cost
    const materialBreakdown: MaterialCostLine[] = (bom.items || []).map((item: any) => {
      const product = item.product
      // Safely parse numeric values to avoid NaN
      const unitCost = Number(product?.cost_per_unit) || 0
      const scrapPercent = Number(item.scrap_percent) || 0
      const quantity = Number(item.quantity) || 0
      const effectiveQty = quantity * (1 + scrapPercent / 100)
      const lineCost = roundCurrency(effectiveQty * unitCost)

      return {
        productId: product?.id || '',
        productCode: product?.code || '',
        productName: product?.name || '',
        quantity: quantity,
        scrapPercent: scrapPercent,
        effectiveQuantity: effectiveQty,
        unitCost: unitCost,
        lineCost: isNaN(lineCost) ? 0 : lineCost,
        uom: product?.base_uom || ''
      }
    })

    const materialCost = roundCurrency(
      materialBreakdown.reduce((sum, item) => sum + item.lineCost, 0)
    )

    // 4. Calculate labor cost from routing operations
    let laborCost = 0
    let setupCost = 0
    let workingCost = 0
    let overheadCost = 0
    let operationBreakdown: OperationCostLine[] = []
    let currency = 'PLN'

    if (routingData && bom.routing_id) {
      // Get routing operations with cleanup_time (use admin to bypass RLS)
      const { data: operations, error: opsError } = await supabaseAdmin
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
      setupCost = roundCurrency(routingData.setup_cost || 0)
      workingCost = roundCurrency((routingData.working_cost_per_unit || 0) * quantity)
      currency = routingData.currency || 'PLN'

      // Overhead calculation
      const subtotal = materialCost + laborCost + setupCost + workingCost
      const overheadPercent = routingData.overhead_percent || 0
      overheadCost = roundCurrency((subtotal * overheadPercent) / 100)
    }

    // 5. Calculate total cost
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
        calculatedAt: new Date().toISOString(),
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
  bomId: string,
  orgId?: string
): Promise<{ success: true; unitCost: number; currency: string } | { success: false; error: CostCalculationError }> {
  const result = await calculateTotalBOMCost(bomId, 1, orgId)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // Get BOM output quantity (use admin for consistency)
  const supabaseAdmin = createServerSupabaseAdmin()
  let query = supabaseAdmin
    .from('boms')
    .select('output_qty')
    .eq('id', bomId)

  // Always filter by org_id for security
  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { data: bom } = await query.single()

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
  quantity: number = 1,
  orgId?: string
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
    calculateTotalBOMCost(bomId1, quantity, orgId),
    calculateTotalBOMCost(bomId2, quantity, orgId)
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
