/**
 * Stock Adjustments API - Reject Adjustment
 * Story: WH-INV-001 - Stock Adjustment History & Approval Workflow
 * Phase: GREEN - Minimal code to pass tests
 *
 * Endpoint:
 * - PUT /api/warehouse/inventory/adjustments/:id/reject - Reject pending adjustment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StockAdjustmentService } from '@/lib/services/stock-adjustment-service'
import { rejectAdjustmentSchema } from '@/lib/validation/stock-adjustment-schema'
import { z } from 'zod'

// =============================================================================
// PUT - Reject Stock Adjustment
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role (only warehouse_manager or admin can reject)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_code')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const allowedRoles = ['warehouse_manager', 'admin']
    if (!allowedRoles.includes(userData.role_code)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only warehouse managers and admins can reject adjustments.' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedInput = rejectAdjustmentSchema.parse(body)

    // Reject adjustment
    const adjustment = await StockAdjustmentService.reject(
      supabase,
      id,
      user.id,
      validatedInput
    )

    return NextResponse.json(adjustment, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[PUT /api/warehouse/inventory/adjustments/:id/reject]', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to reject adjustment',
      },
      { status: 500 }
    )
  }
}
