/**
 * API Route: /api/planning/work-orders/[wo_id]/copy-routing
 * Story 03.12: WO Operations (Routing Copy)
 *
 * POST /api/planning/work-orders/:wo_id/copy-routing - Manual trigger for routing copy (admin only)
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WOOperationsService } from '@/lib/services/wo-operations-service'
import { handleApiError, successResponse, notFoundResponse, forbiddenResponse } from '@/lib/api/error-handler'
import { getAuthContextWithRole, RoleSets } from '@/lib/api/auth-helpers'

// POST /api/planning/work-orders/[wo_id]/copy-routing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wo_id: string }> }
) {
  try {
    const { wo_id } = await params
    const supabase = await createServerSupabase()

    // Check authentication and require admin role
    const { orgId } = await getAuthContextWithRole(supabase, RoleSets.ADMIN_ONLY)

    // Verify WO exists and belongs to user's org
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, routing_id')
      .eq('id', wo_id)
      .single()

    if (woError || !wo) {
      return notFoundResponse('Work order not found')
    }

    // Call copy routing function
    const operationsCreated = await WOOperationsService.copyRoutingToWO(supabase, wo_id, orgId)

    // Generate message based on result
    let message: string
    if (operationsCreated > 0) {
      message = `${operationsCreated} operations copied from routing`
    } else {
      message = 'No operations copied (routing empty or already copied)'
    }

    return successResponse({
      success: true,
      operations_created: operationsCreated,
      message,
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/planning/work-orders/[wo_id]/copy-routing')
  }
}
