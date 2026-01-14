/**
 * BOM Recalculate Cost API Route - Story 02.9
 *
 * POST /api/v1/technical/boms/:id/recalculate-cost
 * Force recalculation of BOM cost and create new product_costs record
 *
 * Auth: Required (technical.U permission)
 * Error codes: 400, 401, 403, 404, 422, 500
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import type { BOMCostResponse, MaterialCostBreakdown, OperationCostBreakdown, RoutingCostBreakdown, OverheadBreakdown, RecalculateCostResponse } from '@/lib/types/costing'

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
// POST /api/v1/technical/boms/:id/recalculate-cost
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()

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

    // Check permissions (technical.U)
    const roleData = userData.role as { code?: string; permissions?: Record<string, string> } | null
    const techPerm = roleData?.permissions?.technical || ''
    const roleCode = roleData?.code || ''

    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechUpdate = techPerm.includes('U')

    if (!isAdmin && !hasTechUpdate) {
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

    // 1. Get BOM with items, routing, and product
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
        routing:routings (
          id,
          code,
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

    // 2. Check if BOM has routing assigned
    if (!bom.routing_id || !bom.routing) {
      return NextResponse.json(
        { error: 'Assign routing to BOM to calculate labor costs', code: 'NO_ROUTING_ASSIGNED' },
        { status: 422 }
      )
    }

    // 3. Check for missing ingredient costs
    const missingCosts: string[] = []
    for (const item of bom.items || []) {
      // eslint-disable-next-line
      const component = (item as any).component
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

    // eslint-disable-next-line
    const routing = (bom as any).routing
    // eslint-disable-next-line
    const product = (bom as any).product
    const batchSize = Number(bom.output_qty) || 1
    const currency = routing?.currency || 'PLN'

    // 4. Calculate material costs
    let totalMaterialCost = 0
    const materials: MaterialCostBreakdown[] = []
    const warnings: string[] = []

    for (const item of bom.items || []) {
      // eslint-disable-next-line
      const component = (item as any).component
      const quantity = Number(item.quantity) || 0
      const scrapPercent = Number(item.scrap_percent) || 0
      const unitCost = Number(component.cost_per_unit) || 0

      const effectiveQty = quantity * (1 + scrapPercent / 100)
      const scrapCost = roundCurrency((quantity * scrapPercent / 100) * unitCost)
      const lineCost = roundCurrency(effectiveQty * unitCost)

      totalMaterialCost += lineCost

      materials.push({
        ingredient_id: component.id,
        ingredient_code: component.code,
        ingredient_name: component.name,
        quantity: quantity,
        uom: component.uom,
        unit_cost: unitCost,
        scrap_percent: scrapPercent,
        scrap_cost: scrapCost,
        total_cost: lineCost,
        percentage: 0
      })
    }

    totalMaterialCost = roundCurrency(totalMaterialCost)

    // 5. Get routing operations and calculate labor cost
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
        // eslint-disable-next-line
        const machine = (op as any).machine

        // Warn if labor rate is 0
        if (laborRate === 0 && (duration > 0 || cleanupTime > 0)) {
          warnings.push(`Operation "${op.operation_name}" has no labor rate set`)
        }

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
          percentage: 0
        })
      }
    }

    totalLaborCost = roundCurrency(totalLaborCost)

    // 6. Calculate routing-level costs
    const setupCost = roundCurrency(Number(routing.setup_cost) || 0)
    const workingCostPerUnit = Number(routing.working_cost_per_unit) || 0
    const totalWorkingCost = roundCurrency(workingCostPerUnit * batchSize)
    const totalRoutingCost = roundCurrency(setupCost + totalWorkingCost)

    const routingBreakdown: RoutingCostBreakdown = {
      routing_id: routing.id,
      routing_code: routing.code,
      setup_cost: setupCost,
      working_cost_per_unit: workingCostPerUnit,
      total_working_cost: totalWorkingCost,
      total_routing_cost: totalRoutingCost
    }

    // 7. Calculate overhead
    const subtotalBeforeOverhead = roundCurrency(
      totalMaterialCost + totalLaborCost + totalRoutingCost
    )
    const overheadPercent = Number(routing.overhead_percent) || 0
    const overheadCost = roundCurrency((subtotalBeforeOverhead * overheadPercent) / 100)

    const overhead: OverheadBreakdown = {
      allocation_method: 'percentage',
      overhead_percent: overheadPercent,
      subtotal_before_overhead: subtotalBeforeOverhead,
      overhead_cost: overheadCost
    }

    // 8. Calculate total cost
    const totalCost = roundCurrency(subtotalBeforeOverhead + overheadCost)
    const costPerUnit = roundCurrency(totalCost / batchSize)

    // 9. Calculate percentages
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

    // 10. Margin analysis
    let marginAnalysis = undefined
    const stdPrice = Number(product?.std_price)
    const targetMarginPercent = 30

    if (stdPrice && stdPrice > 0) {
      const actualMarginPercent = roundCurrency(((stdPrice - costPerUnit) / stdPrice) * 100)
      marginAnalysis = {
        std_price: stdPrice,
        target_margin_percent: targetMarginPercent,
        actual_margin_percent: actualMarginPercent,
        below_target: actualMarginPercent < targetMarginPercent
      }
    }

    // 11. Store in product_costs table
    const effectiveFrom = new Date().toISOString().split('T')[0]

    // First, close any existing open cost records for this product
    await supabaseAdmin
      .from('product_costs')
      .update({ effective_to: effectiveFrom })
      .eq('product_id', bom.product_id)
      .eq('org_id', userData.org_id)
      .is('effective_to', null)

    // Create new cost record
    const { error: insertError } = await supabaseAdmin
      .from('product_costs')
      .insert({
        org_id: userData.org_id,
        product_id: bom.product_id,
        cost_type: 'standard',
        material_cost: totalMaterialCost,
        labor_cost: totalLaborCost,
        overhead_cost: overheadCost,
        total_cost: totalCost,
        effective_from: effectiveFrom,
        effective_to: null,
        calculation_method: 'bom_routing',
        created_by: user.id
      })

    if (insertError) {
      console.error('Failed to store cost record:', insertError)
      warnings.push('Cost calculated but failed to store in database')
    }

    // 12. Build response
    const calculatedAt = new Date().toISOString()

    const costResponse: BOMCostResponse = {
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
      calculated_at: calculatedAt,
      calculated_by: user.id,
      is_stale: false,
      breakdown: {
        materials,
        operations: operationBreakdown,
        routing: routingBreakdown,
        overhead
      },
      margin_analysis: marginAnalysis || null
    }

    const response: RecalculateCostResponse = {
      success: true,
      cost: costResponse,
      calculated_at: calculatedAt,
      warnings: warnings.length > 0 ? warnings : undefined
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('POST recalculate cost error:', error)
    return NextResponse.json(
      { error: 'Cost calculation failed', code: 'CALCULATION_ERROR' },
      { status: 500 }
    )
  }
}
