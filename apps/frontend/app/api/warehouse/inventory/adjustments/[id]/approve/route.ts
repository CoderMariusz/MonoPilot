/**
 * Stock Adjustments API - Approve Adjustment
 * Story: WH-INV-001 - Stock Adjustment History & Approval Workflow
 * Phase: GREEN - Minimal code to pass tests
 *
 * Endpoint:
 * - PUT /api/warehouse/inventory/adjustments/:id/approve - Approve pending adjustment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StockAdjustmentService } from '@/lib/services/stock-adjustment-service'

// =============================================================================
// PUT - Approve Stock Adjustment
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

    // Check user role (only warehouse_manager or admin can approve)
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
        { error: 'Insufficient permissions. Only warehouse managers and admins can approve adjustments.' },
        { status: 403 }
      )
    }

    // Approve adjustment
    const adjustment = await StockAdjustmentService.approve(
      supabase,
      id,
      user.id
    )

    return NextResponse.json(adjustment, { status: 200 })
  } catch (error) {
    console.error('[PUT /api/warehouse/inventory/adjustments/:id/approve]', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to approve adjustment',
      },
      { status: 500 }
    )
  }
}
