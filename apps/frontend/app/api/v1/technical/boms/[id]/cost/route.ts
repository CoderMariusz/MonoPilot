/**
 * BOM Cost API Route - Story 02.9
 *
 * GET /api/v1/technical/boms/:id/cost
 * Returns calculated cost breakdown for a BOM
 *
 * Auth: Required (technical.R permission)
 * Error codes: 400, 401, 403, 404, 422
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import type { BOMCostResponse, MaterialCostBreakdown, OperationCostBreakdown, RoutingCostBreakdown, OverheadBreakdown } from '@/lib/types/costing'

// UUID validation schema
const uuidSchema = z.string().uuid('Invalid UUID format')

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
// GET /api/v1/technical/boms/:id/cost
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get user's org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        org_id,
        role:roles (
          code,
          permissions
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData?.org_id) {
      return NextResponse.json(
        { error: 'User not found', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Check permissions (technical.R)
    const roleData = userData.role as { code?: string; permissions?: Record<string, string> } | null
    const techPerm = roleData?.permissions?.technical || ''
    const roleCode = roleData?.code || ''

    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechRead = techPerm.includes('R')

    if (!isAdmin && !hasTechRead) {
      return NextResponse.json(
        { error: 'Permission denied', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Validate UUID format before database query
    const uuidValidation = uuidSchema.safeParse(id)
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'Invalid BOM ID format', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // 1. Get BOM with items and product (fetch routing separately to avoid join issues)
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select(`
        id,
        product_id,
        routing_id,
        output_qty,
        output_uom,
        updated_at,
        product:products!product_id (
          id,
          code,
          name,
          std_price
        ),
        items:bom_items (
          id,
          quantity,
          scrap_percent,
          operation_seq,
          component:products!product_id (
            id,
            code,
            name,
            cost_per_unit,
            uom
          )
        )
      `)
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (bomError || !bom) {
      return NextResponse.json(
        { error: 'BOM not found', code: 'BOM_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 2. Fetch routing separately if routing_id is set
    let routingData: {
      id: string
      code: string
      name: string
      setup_cost: number
      working_cost_per_unit: number
      overhead_percent: number
      currency: string
    } | null = null

    if (bom.routing_id) {
      const { data: routing } = await supabase
        .from('routings')
        .select('id, code, name, setup_cost, working_cost_per_unit, overhead_percent, currency')
        .eq('id', bom.routing_id)
        .single()

      routingData = routing
    }

    // 3. Check if BOM has routing assigned
    if (!bom.routing_id || !routingData) {
      return NextResponse.json(
        { error: 'Assign routing to BOM to calculate labor costs', code: 'NO_ROUTING_ASSIGNED' },
        { status: 422 }
      )
    }

    // 4. Check for missing ingredient costs
    const missingCosts: string[] = []
    for (const item of bom.items || []) {
      const component = (item as { component?: { code?: string; name?: string; cost_per_unit?: number } }).component
      if (!component?.cost_per_unit) {
        missingCosts.push(`${component?.code || 'Unknown'} (${component?.name || 'Unknown'})`)
      }
    }

    if (missingCosts.length > 0) {
      return NextResponse.json(
        {
          error: `Missing cost data for: ${missingCosts.join(', ')}`,
          code: 'MISSING_INGREDIENT_COSTS',
          details: missingCosts
        },
        { status: 422 }
      )
    }

    const product = (bom as { product?: { id?: string; code?: string; name?: string; std_price?: number } | null }).product
    const batchSize = Number(bom.output_qty) || 1
    const currency = routingData.currency || 'PLN'

    // 5. Calculate material costs
    let totalMaterialCost = 0
    const materials: MaterialCostBreakdown[] = []

    for (const item of bom.items || []) {
      const component = (item as { component?: { id?: string; code?: string; name?: string; cost_per_unit?: number; uom?: string } }).component
      if (!component) continue // Skip items without component

      const quantity = Number(item.quantity) || 0
      const scrapPercent = Number(item.scrap_percent) || 0
      const unitCost = Number(component.cost_per_unit) || 0

      const effectiveQty = quantity * (1 + scrapPercent / 100)
      const scrapCost = roundCurrency((quantity * scrapPercent / 100) * unitCost)
      const lineCost = roundCurrency(effectiveQty * unitCost)

      totalMaterialCost += lineCost

      materials.push({
        ingredient_id: component.id || '',
        ingredient_code: component.code || '',
        ingredient_name: component.name || '',
        quantity: quantity,
        uom: component.uom || '',
        unit_cost: unitCost,
        scrap_percent: scrapPercent,
        scrap_cost: scrapCost,
        total_cost: lineCost,
        percentage: 0 // Will calculate after total
      })
    }

    totalMaterialCost = roundCurrency(totalMaterialCost)

    // 6. Get routing operations and calculate labor cost
    // Column names from migration 047: operation_name, expected_duration_minutes, setup_time_minutes, cleanup_time_minutes, labor_cost
    const { data: operations, error: opsError } = await supabase
      .from('routing_operations')
      .select(`
        id,
        sequence,
        operation_name,
        expected_duration_minutes,
        setup_time_minutes,
        cleanup_time_minutes,
        labor_cost,
        machine:machines (
          id,
          name
        )
      `)
      .eq('routing_id', bom.routing_id)
      .order('sequence', { ascending: true })

    let totalLaborCost = 0
    const operationBreakdown: OperationCostBreakdown[] = []

    if (!opsError && operations) {
      for (const op of operations) {
        const duration = Number(op.expected_duration_minutes) || 0
        const setupTime = Number(op.setup_time_minutes) || 0
        const cleanupTime = Number(op.cleanup_time_minutes) || 0
        // labor_cost is stored as hourly rate in the DB
        const laborRate = Number(op.labor_cost) || 0
         
        const machine = (op as any).machine

        const setupCost = roundCurrency((setupTime / 60) * laborRate)
        const runCost = roundCurrency((duration / 60) * laborRate)
        const cleanupCost = roundCurrency((cleanupTime / 60) * laborRate)
        const opTotalCost = roundCurrency(setupCost + runCost + cleanupCost)

        totalLaborCost += opTotalCost

        operationBreakdown.push({
          operation_seq: op.sequence,
          operation_name: op.operation_name,
          machine_name: machine?.name || null,
          setup_time_min: setupTime,
          duration_min: duration,
          cleanup_time_min: cleanupTime,
          labor_rate: laborRate,
          setup_cost: setupCost,
          run_cost: runCost,
          cleanup_cost: cleanupCost,
          total_cost: opTotalCost,
          percentage: 0 // Will calculate after total
        })
      }
    }

    totalLaborCost = roundCurrency(totalLaborCost)

    // 7. Calculate routing-level costs
    const setupCost = roundCurrency(Number(routingData.setup_cost) || 0)
    const workingCostPerUnit = Number(routingData.working_cost_per_unit) || 0
    const totalWorkingCost = roundCurrency(workingCostPerUnit * batchSize)
    const totalRoutingCost = roundCurrency(setupCost + totalWorkingCost)

    const routingBreakdown: RoutingCostBreakdown = {
      routing_id: routingData.id,
      routing_code: routingData.code,
      setup_cost: setupCost,
      working_cost_per_unit: workingCostPerUnit,
      total_working_cost: totalWorkingCost,
      total_routing_cost: totalRoutingCost
    }

    // 8. Calculate overhead
    const subtotalBeforeOverhead = roundCurrency(
      totalMaterialCost + totalLaborCost + totalRoutingCost
    )
    const overheadPercent = Number(routingData.overhead_percent) || 0
    const overheadCost = roundCurrency((subtotalBeforeOverhead * overheadPercent) / 100)

    const overhead: OverheadBreakdown = {
      allocation_method: 'percentage',
      overhead_percent: overheadPercent,
      subtotal_before_overhead: subtotalBeforeOverhead,
      overhead_cost: overheadCost
    }

    // 9. Calculate total cost
    const totalCost = roundCurrency(subtotalBeforeOverhead + overheadCost)
    const costPerUnit = roundCurrency(totalCost / batchSize)

    // 10. Calculate percentages for breakdown
    if (totalMaterialCost > 0) {
      for (const mat of materials) {
        mat.percentage = roundCurrency((mat.total_cost / totalMaterialCost) * 100)
      }
    }

    if (totalLaborCost > 0) {
      for (const op of operationBreakdown) {
        op.percentage = roundCurrency((op.total_cost / totalLaborCost) * 100)
      }
    }

    // 11. Margin analysis
    let marginAnalysis = undefined
    const stdPrice = Number(product?.std_price)
    const targetMarginPercent = 30 // Default target margin

    if (stdPrice && stdPrice > 0) {
      const actualMarginPercent = roundCurrency(((stdPrice - costPerUnit) / stdPrice) * 100)
      marginAnalysis = {
        std_price: stdPrice,
        target_margin_percent: targetMarginPercent,
        actual_margin_percent: actualMarginPercent,
        below_target: actualMarginPercent < targetMarginPercent
      }
    }

    // 12. Build response
    const response: BOMCostResponse = {
      bom_id: bom.id,
      product_id: bom.product_id,
      cost_type: 'standard',
      batch_size: batchSize,
      batch_uom: bom.output_uom || 'kg',
      material_cost: totalMaterialCost,
      labor_cost: totalLaborCost,
      overhead_cost: overheadCost,
      total_cost: totalCost,
      cost_per_unit: costPerUnit,
      currency: currency,
      calculated_at: new Date().toISOString(),
      calculated_by: user.id,
      is_stale: false, // Could compare with last product_costs record
      breakdown: {
        materials,
        operations: operationBreakdown,
        routing: routingBreakdown,
        overhead
      },
      margin_analysis: marginAnalysis || null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET BOM cost error:', error)
    return NextResponse.json(
      { error: 'Cost calculation failed', code: 'CALCULATION_ERROR' },
      { status: 500 }
    )
  }
}
