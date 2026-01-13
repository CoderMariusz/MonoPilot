/**
 * API Route: Update Work Order Yield
 * Story: 04.4 - Yield Tracking
 * PATCH /api/production/work-orders/:id/yield
 *
 * Updates the produced_quantity on a work order and calculates yield percentage.
 * Creates audit trail in yield_logs table.
 *
 * Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-014)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  YieldService,
  validateYieldUpdate,
  getYieldIndicatorColor,
} from '@/lib/services/yield-service'
import { updateYieldSchema } from '@/lib/validation/yield-validation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Not logged in' },
        { status: 401 }
      )
    }

    // Get current user with role and org
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Role-based authorization
    const allowedRoles = ['admin', 'manager', 'production_manager', 'operator']
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'Insufficient permissions to update yield',
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'INVALID_JSON', message: 'Invalid request body' },
        { status: 400 }
      )
    }

    const parseResult = updateYieldSchema.safeParse(body)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: firstError.message,
          details: parseResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { produced_quantity, notes } = parseResult.data

    // Validate business rules
    const validation = await validateYieldUpdate(
      supabase,
      woId,
      produced_quantity,
      currentUser.org_id
    )

    if (!validation.valid) {
      // Determine appropriate error code
      let errorCode = 'VALIDATION_ERROR'
      let statusCode = 400

      if (validation.error?.includes('not found')) {
        errorCode = 'NOT_FOUND'
        statusCode = 404
      } else if (validation.error?.includes('In Progress')) {
        errorCode = 'INVALID_WO_STATUS'
      }

      return NextResponse.json(
        { error: errorCode, message: validation.error },
        { status: statusCode }
      )
    }

    // Update yield
    const result = await YieldService.updateWorkOrderYield(
      supabase,
      woId,
      produced_quantity,
      currentUser.id,
      notes
    )

    // Add low yield warning if applicable
    const response: Record<string, unknown> = {
      success: true,
      data: result,
    }

    if (result.yield_percent < 80 && result.yield_percent > 0) {
      response.low_yield_warning = true
      if (result.yield_percent < 70) {
        response.warning_message = `Critical Low Yield: ${result.yield_percent}% (Target: >=80%)`
      } else {
        response.warning_message = `Low Yield Alert: ${result.yield_percent}% (Target: >=80%)`
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in PATCH /api/production/work-orders/:id/yield:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to update yield. Please try again.' },
      { status: 500 }
    )
  }
}
