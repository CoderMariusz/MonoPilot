/**
 * Routing Cost API Route - Story 02.9
 *
 * GET /api/v1/technical/routings/:id/cost
 * Returns routing-only cost (labor + routing costs, no materials)
 *
 * Auth: Required (technical.R permission)
 * Error codes: 400, 401, 403, 404, 500
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { routingCostQuerySchema } from '@/lib/validation/costing-schema'
import type { RoutingCostResponse, OperationCostBreakdown, RoutingCostBreakdown } from '@/lib/types/costing'

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
// GET /api/v1/technical/routings/:id/cost
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      batch_size: searchParams.get('batch_size') || '1'
    }

    const queryValidation = routingCostQuerySchema.safeParse(queryParams)
    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid batch_size parameter',
          code: 'INVALID_BATCH_SIZE',
          details: queryValidation.error.errors
        },
        { status: 400 }
      )
    }

    const { batch_size: batchSize } = queryValidation.data
    const { id } = await params

    // Validate UUID format before database query
    const uuidValidation = uuidSchema.safeParse(id)
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'Invalid routing ID format', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // 1. Get routing
    const { data: routing, error: routingError } = await supabase
      .from('routings')
      .select(`
        id,
        code,
        name,
        setup_cost,
        working_cost_per_unit,
        overhead_percent,
        currency
      `)
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (routingError || !routing) {
      return NextResponse.json(
        { error: 'Routing not found', code: 'ROUTING_NOT_FOUND' },
        { status: 404 }
      )
    }

    const currency = routing.currency || 'PLN'

    // 2. Get routing operations
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
      .eq('routing_id', id)
      .order('sequence', { ascending: true })

    // 3. Calculate operation labor costs
    let totalOperationCost = 0
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

        totalOperationCost += opTotalCost

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

    totalOperationCost = roundCurrency(totalOperationCost)

    // 4. Calculate percentages for operations
    if (totalOperationCost > 0) {
      for (const op of operationBreakdown) {
        op.percentage = roundCurrency((op.total_cost / totalOperationCost) * 100)
      }
    }

    // 5. Calculate routing-level costs
    const setupCost = roundCurrency(Number(routing.setup_cost) || 0)
    const workingCostPerUnit = Number(routing.working_cost_per_unit) || 0
    const totalWorkingCost = roundCurrency(workingCostPerUnit * batchSize)
    const totalRoutingCostOnly = roundCurrency(setupCost + totalWorkingCost)

    const routingBreakdown: RoutingCostBreakdown = {
      routing_id: routing.id,
      routing_code: routing.code,
      setup_cost: setupCost,
      working_cost_per_unit: workingCostPerUnit,
      total_working_cost: totalWorkingCost,
      total_routing_cost: totalRoutingCostOnly
    }

    // 6. Calculate total (operations + routing, NO materials)
    const totalCost = roundCurrency(totalOperationCost + totalRoutingCostOnly)

    // 7. Build response
    const response: RoutingCostResponse = {
      routing_id: routing.id,
      routing_code: routing.code,
      total_operation_cost: totalOperationCost,
      total_routing_cost: totalRoutingCostOnly,
      total_cost: totalCost,
      currency: currency,
      breakdown: {
        operations: operationBreakdown,
        routing: routingBreakdown
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET routing cost error:', error)
    return NextResponse.json(
      { error: 'Routing cost calculation failed', code: 'ROUTING_COST_FAILED' },
      { status: 500 }
    )
  }
}
