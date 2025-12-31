/**
 * API Route: /api/planning/work-orders/[id]/snapshot
 * Story 03.11a: WO Materials (BOM Snapshot) - Create/Refresh snapshot
 *
 * Creates or refreshes BOM snapshot (wo_materials):
 * - Only allowed for draft/planned WOs
 * - Returns 409 Conflict for released/in_progress WOs
 * - Returns 400 if WO has no BOM selected
 * - Scales quantities using scaleQuantity formula
 * - Includes by-products with required_qty = 0
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { handleApiError, successResponse, notFoundResponse } from '@/lib/api/error-handler'
import { getAuthContextWithRole, RoleSets } from '@/lib/api/auth-helpers'
import { canModifySnapshot, refreshSnapshot } from '@/lib/services/wo-snapshot-service'

// POST /api/planning/work-orders/[id]/snapshot - Create/refresh BOM snapshot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication and permissions
    const { orgId } = await getAuthContextWithRole(supabase, RoleSets.WORK_ORDER_WRITE)

    // Get WO with status and BOM info
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, status, bom_id, planned_quantity')
      .eq('id', id)
      .single()

    if (woError || !wo) {
      return notFoundResponse('Work order not found')
    }

    // Check if snapshot can be modified
    if (!canModifySnapshot(wo.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WO_RELEASED',
            message: 'Cannot modify materials after WO is released',
          },
        },
        { status: 409 }
      )
    }

    // Check BOM exists
    if (!wo.bom_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_BOM_SELECTED',
            message: 'Work order has no BOM selected',
          },
        },
        { status: 400 }
      )
    }

    // Create/refresh snapshot
    const materials = await refreshSnapshot(
      supabase,
      id,
      wo.bom_id,
      wo.planned_quantity,
      orgId
    )

    return successResponse({
      success: true,
      materials_count: materials.length,
      message: `Snapshot created with ${materials.length} materials`,
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/planning/work-orders/[id]/snapshot')
  }
}
