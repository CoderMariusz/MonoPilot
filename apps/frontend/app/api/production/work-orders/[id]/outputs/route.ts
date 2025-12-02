/**
 * POST /api/production/work-orders/:id/outputs
 * GET /api/production/work-orders/:id/outputs
 * Story 4.12: Output Registration Desktop
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  registerOutput,
  getWOOutputs,
  calculateConsumptionAllocation,
  OUTPUT_ERROR_CODES,
} from '@/lib/services/output-registration-service'

// POST - Register new output (AC-4.12.7)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user details
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not found' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      qty,
      qa_status,
      location_id,
      notes,
      is_over_production,
      over_production_parent_lp_id,
    } = body

    // Validate required fields (AC-4.12.8)
    if (!qty || qty <= 0) {
      return NextResponse.json(
        { error: OUTPUT_ERROR_CODES.INVALID_QTY, message: 'Output quantity must be > 0' },
        { status: 400 }
      )
    }

    // Verify WO belongs to user's org
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, org_id, status')
      .eq('id', woId)
      .single()

    if (woError || !wo || wo.org_id !== userRecord.org_id) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Work order not found' },
        { status: 404 }
      )
    }

    // Register output
    const result = await registerOutput(
      {
        woId,
        qty: Number(qty),
        qaStatus: qa_status,
        locationId: location_id,
        notes,
        isOverProduction: is_over_production,
        overProductionParentLpId: over_production_parent_lp_id,
      },
      userRecord.id,
      userRecord.org_id
    )

    // TODO: AC-4.12.9 - Check for by-products and return flag for frontend
    // This will be implemented in Story 4.14 (By-Product Registration)
    // For now, return success without by-product prompt

    return NextResponse.json({
      data: result,
      message: 'Output registered successfully',
      // has_by_products: false, // Story 4.14 will add this check
    })
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string; details?: unknown }

    // Handle known error codes
    if (err.code === OUTPUT_ERROR_CODES.WO_NOT_IN_PROGRESS) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 400 }
      )
    }

    if (err.code === OUTPUT_ERROR_CODES.OVER_CONSUMPTION_DENIED) {
      return NextResponse.json(
        {
          error: err.code,
          message: err.message,
          details: err.details,
          requires_confirmation: true,
        },
        { status: 409 } // Conflict - needs user decision
      )
    }

    if (err.code === OUTPUT_ERROR_CODES.MISSING_PARENT_LP) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 400 }
      )
    }

    console.error('Output registration error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// GET - Get output history for WO
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's org_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not found' },
        { status: 401 }
      )
    }

    // Verify WO belongs to user's org
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, org_id, planned_quantity, output_qty, uom')
      .eq('id', woId)
      .single()

    if (woError || !wo || wo.org_id !== userRecord.org_id) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Work order not found' },
        { status: 404 }
      )
    }

    // Get outputs
    const outputs = await getWOOutputs(woId)

    // Get allocation preview
    const allocation = await calculateConsumptionAllocation(woId, 1)

    // Calculate progress (AC-4.12.5)
    const progress = wo.planned_quantity
      ? ((Number(wo.output_qty) || 0) / Number(wo.planned_quantity)) * 100
      : 0

    return NextResponse.json({
      data: outputs,
      summary: {
        planned_qty: wo.planned_quantity,
        output_qty: wo.output_qty || 0,
        progress_percent: Math.round(progress * 100) / 100,
        uom: wo.uom,
        total_reserved: allocation.totalReserved,
        cumulative_consumed: allocation.cumulativeAfter - 1, // subtract preview qty
      },
    })
  } catch (error) {
    console.error('Get outputs error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
