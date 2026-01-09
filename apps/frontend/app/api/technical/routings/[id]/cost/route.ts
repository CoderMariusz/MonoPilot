import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Routing Cost API
 * Story: 02.9 - BOM-Routing Costs
 *
 * GET /api/technical/routings/[id]/cost - Get routing labor/overhead costs
 *
 * Returns:
 * - routing_id: Routing UUID
 * - routing_code: Routing code
 * - total_operation_cost: Sum of all operation labor costs
 * - total_routing_cost: Setup + working costs
 * - total_cost: Combined total
 * - currency: Cost currency
 * - breakdown: Detailed operations and routing costs
 */

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get routing with cost fields
    const { data: routing, error: routingError } = await supabase
      .from('routings')
      .select(
        'id, org_id, code, name, setup_cost, working_cost_per_unit, overhead_percent, currency'
      )
      .eq('id', id)
      .single()

    if (routingError || !routing) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    if (routing.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    // Get routing operations with labor costs
    const { data: operations, error: opsError } = await supabase
      .from('routing_operations')
      .select(
        'id, sequence, name, estimated_duration_minutes, labor_cost_per_hour, cleanup_time'
      )
      .eq('routing_id', id)
      .order('sequence', { ascending: true })

    if (opsError) {
      return NextResponse.json(
        { error: 'Failed to fetch routing operations' },
        { status: 500 }
      )
    }

    // Calculate operation costs
    const operationBreakdown = (operations || []).map((op) => {
      const duration = op.estimated_duration_minutes || 0
      const setupTime = 0 // Setup is at routing level
      const cleanupTime = op.cleanup_time || 0
      const laborRate = op.labor_cost_per_hour || 0

      const setupCost = roundCurrency((setupTime / 60) * laborRate)
      const runCost = roundCurrency((duration / 60) * laborRate)
      const cleanupCost = roundCurrency((cleanupTime / 60) * laborRate)
      const totalCost = roundCurrency(setupCost + runCost + cleanupCost)

      return {
        operation_seq: op.sequence,
        operation_name: op.name,
        machine_name: null,
        setup_time_min: setupTime,
        duration_min: duration,
        cleanup_time_min: cleanupTime,
        labor_rate: laborRate,
        setup_cost: setupCost,
        run_cost: runCost,
        cleanup_cost: cleanupCost,
        total_cost: totalCost,
        percentage: 0, // Will be calculated after totals
      }
    })

    const totalOperationCost = roundCurrency(
      operationBreakdown.reduce((sum, op) => sum + op.total_cost, 0)
    )

    // Update percentages
    operationBreakdown.forEach((op) => {
      op.percentage =
        totalOperationCost > 0
          ? roundCurrency((op.total_cost / totalOperationCost) * 100)
          : 0
    })

    // Routing-level costs
    const setupCost = roundCurrency(routing.setup_cost || 0)
    const workingCostPerUnit = roundCurrency(routing.working_cost_per_unit || 0)
    const totalRoutingCost = roundCurrency(setupCost + workingCostPerUnit)
    const totalCost = roundCurrency(totalOperationCost + totalRoutingCost)

    const response = {
      routing_id: routing.id,
      routing_code: routing.code || '',
      total_operation_cost: totalOperationCost,
      total_routing_cost: totalRoutingCost,
      total_cost: totalCost,
      currency: routing.currency || 'PLN',
      breakdown: {
        operations: operationBreakdown,
        routing: {
          routing_id: routing.id,
          routing_code: routing.code || '',
          setup_cost: setupCost,
          working_cost_per_unit: workingCostPerUnit,
          total_working_cost: workingCostPerUnit,
          total_routing_cost: totalRoutingCost,
        },
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/technical/routings/[id]/cost:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
