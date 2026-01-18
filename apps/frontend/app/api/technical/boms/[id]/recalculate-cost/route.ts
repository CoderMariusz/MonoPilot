import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { calculateTotalBOMCost } from '@/lib/services/costing-service'

/**
 * BOM Cost Recalculation API
 * Story: 02.9 - BOM-Routing Costs
 *
 * POST /api/technical/boms/[id]/recalculate-cost - Recalculate and save BOM cost
 *
 * Returns:
 * - success: boolean
 * - cost: Updated cost breakdown
 * - calculated_at: Timestamp
 * - warnings: Optional array of warning messages
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to verify org access
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify BOM exists and belongs to user's org
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, org_id, product_id, output_qty, routing_id')
      .eq('id', id)
      .single()

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    if (bom.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Calculate BOM cost - pass org_id for reliable RLS with cross-table joins
    const result = await calculateTotalBOMCost(id, bom.output_qty || 1, currentUser.org_id)

    if (!result.success) {
      const statusCode = result.error.code === 'BOM_NOT_FOUND' ? 404 : 500
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: statusCode }
      )
    }

    const costData = result.data
    const calculatedAt = new Date().toISOString()

    // Save to product_costs table
    const { error: saveError } = await supabase.from('product_costs').insert({
      org_id: currentUser.org_id,
      product_id: bom.product_id,
      cost_type: 'standard',
      material_cost: costData.materialCost,
      labor_cost: costData.laborCost,
      overhead_cost: costData.overheadCost,
      total_cost: costData.totalCost,
      effective_from: new Date().toISOString().split('T')[0],
      calculation_method: 'bom_routing',
      created_by: currentUser.id,
    })

    // Log warning but don't fail if save fails
    if (saveError) {
      console.warn('Failed to save product_costs record:', saveError)
    }

    // Build response matching RecalculateCostResponse type
    const response = {
      success: true,
      cost: {
        bom_id: id,
        product_id: bom.product_id,
        cost_type: 'standard' as const,
        batch_size: bom.output_qty || 1,
        batch_uom: 'kg',
        material_cost: costData.materialCost,
        labor_cost: costData.laborCost,
        overhead_cost: costData.overheadCost,
        total_cost: costData.totalCost,
        cost_per_unit:
          costData.totalCost / (bom.output_qty || 1),
        currency: costData.currency,
        calculated_at: calculatedAt,
        calculated_by: currentUser.id,
        is_stale: false,
        breakdown: {
          materials: costData.breakdown.materials.map((m) => ({
            ingredient_id: m.productId,
            ingredient_code: m.productCode,
            ingredient_name: m.productName,
            quantity: m.quantity,
            uom: m.uom,
            unit_cost: m.unitCost,
            scrap_percent: m.scrapPercent || 0,
            scrap_cost: (m.lineCost - m.quantity * m.unitCost),
            total_cost: m.lineCost,
            percentage:
              costData.materialCost > 0
                ? (m.lineCost / costData.materialCost) * 100
                : 0,
          })),
          operations: costData.breakdown.operations.map((op) => ({
            operation_seq: op.sequence,
            operation_name: op.operationName,
            machine_name: null,
            setup_time_min: op.setupTime,
            duration_min: op.duration,
            cleanup_time_min: op.cleanupTime,
            labor_rate: op.laborRate,
            setup_cost: (op.setupTime / 60) * op.laborRate,
            run_cost: (op.duration / 60) * op.laborRate,
            cleanup_cost: (op.cleanupTime / 60) * op.laborRate,
            total_cost: op.laborCost,
            percentage:
              costData.laborCost > 0
                ? (op.laborCost / costData.laborCost) * 100
                : 0,
          })),
          routing: {
            routing_id: bom.routing_id || '',
            routing_code: '',
            setup_cost: costData.setupCost,
            working_cost_per_unit:
              costData.workingCost / (bom.output_qty || 1),
            total_working_cost: costData.workingCost,
            total_routing_cost: costData.setupCost + costData.workingCost,
          },
          overhead: {
            allocation_method: 'percentage' as const,
            overhead_percent: 0,
            subtotal_before_overhead:
              costData.totalCost - costData.overheadCost,
            overhead_cost: costData.overheadCost,
          },
        },
        margin_analysis: null,
      },
      calculated_at: calculatedAt,
      warnings: saveError ? ['Cost saved but product_costs record failed'] : undefined,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/technical/boms/[id]/recalculate-cost:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
