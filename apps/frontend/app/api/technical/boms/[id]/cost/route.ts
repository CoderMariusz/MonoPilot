import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { calculateTotalBOMCost } from '@/lib/services/costing-service'

/**
 * BOM Cost Calculation API
 * Story: 2.51, 2.52, 2.53
 * Related: ADR-009-routing-level-costs
 *
 * GET /api/technical/boms/[id]/cost - Calculate complete BOM cost
 *
 * Query parameters:
 * - quantity (optional): Number of output units, default 1
 *
 * Returns:
 * - materialCost: Sum of all bom_items costs
 * - laborCost: Sum of all routing operation labor costs
 * - setupCost: Fixed routing setup cost per batch
 * - workingCost: Variable working cost per unit * quantity
 * - overheadCost: Overhead percentage on subtotal
 * - totalCost: Sum of all costs
 * - currency: Cost currency (default PLN)
 * - breakdown: Detailed material and operation cost lines
 */

export async function GET(
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

    console.log('[BOM Cost Route] User context:', {
      userId: session.user.id,
      orgId: currentUser.org_id,
      hasOrgId: !!currentUser.org_id
    })

    // Verify BOM exists and belongs to user's org
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, org_id, product_id, output_qty, output_uom')
      .eq('id', id)
      .single()

    console.log('[BOM Cost Route] BOM check:', {
      bomId: id,
      found: !!bom,
      bomOrgId: bom?.org_id,
      userOrgId: currentUser.org_id,
      error: bomError?.message
    })

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found', debug: { bomError: bomError?.message } }, { status: 404 })
    }

    if (bom.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'BOM not found (org mismatch)' }, { status: 404 })
    }

    // Parse quantity from query params
    const searchParams = request.nextUrl.searchParams
    const quantityParam = searchParams.get('quantity')
    const quantity = quantityParam ? parseInt(quantityParam, 10) : 1

    if (isNaN(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid quantity parameter. Must be a positive integer.' },
        { status: 400 }
      )
    }

    // Calculate BOM cost - pass org_id for reliable RLS with cross-table joins
    const result = await calculateTotalBOMCost(id, quantity, currentUser.org_id)

    if (!result.success) {
      const statusCode = result.error.code === 'BOM_NOT_FOUND' ? 404 : 500
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: statusCode }
      )
    }

    // Transform camelCase response to snake_case for API contract
    const costData = result.data
    const outputQty = bom.output_qty || 1
    const response = {
      bom_id: id,
      product_id: bom.product_id,
      cost_type: 'standard',
      batch_size: outputQty,
      batch_uom: bom.output_uom || 'kg',
      material_cost: costData.materialCost,
      labor_cost: costData.laborCost,
      overhead_cost: costData.overheadCost,
      total_cost: costData.totalCost,
      cost_per_unit: costData.totalCost / outputQty,
      currency: costData.currency,
      calculated_at: costData.calculatedAt,
      calculated_by: currentUser.id || null,
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
          scrap_cost: 0,
          total_cost: m.lineCost,
          percentage: costData.materialCost > 0 ? (m.lineCost / costData.materialCost) * 100 : 0,
        })),
        operations: costData.breakdown.operations.map((op) => ({
          operation_seq: op.sequence,
          operation_name: op.operationName,
          machine_name: null,
          setup_time_min: op.setupTime,
          duration_min: op.duration,
          cleanup_time_min: op.cleanupTime,
          labor_rate: op.laborRate,
          setup_cost: 0,
          run_cost: 0,
          cleanup_cost: 0,
          total_cost: op.laborCost,
          percentage: costData.laborCost > 0 ? (op.laborCost / costData.laborCost) * 100 : 0,
        })),
        routing: {
          routing_id: '',
          routing_code: '',
          setup_cost: costData.setupCost,
          working_cost_per_unit: costData.workingCost / outputQty,
          total_working_cost: costData.workingCost,
          total_routing_cost: costData.setupCost + costData.workingCost,
        },
        overhead: {
          allocation_method: 'percentage',
          overhead_percent: 0,
          subtotal_before_overhead: costData.totalCost - costData.overheadCost,
          overhead_cost: costData.overheadCost,
        },
      },
      margin_analysis: null,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/technical/boms/[id]/cost:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
