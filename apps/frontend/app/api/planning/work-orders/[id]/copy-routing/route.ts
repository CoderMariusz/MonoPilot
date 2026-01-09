/**
 * API Route: /api/planning/work-orders/[id]/copy-routing
 * Story 03.12: WO Operations (Routing Copy)
 *
 * POST /api/planning/work-orders/:id/copy-routing - Manually trigger routing copy (admin)
 *
 * Copies routing operations to wo_operations table.
 * Normally this happens automatically on WO release, but this endpoint
 * allows admins to manually trigger the copy.
 *
 * Security:
 * - Auth required
 * - Admin-only (owner, admin roles)
 * - RLS enforces org isolation
 * - Idempotent (won't duplicate if operations already exist)
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WOOperationsService } from '@/lib/services/wo-operations-service'
import {
  handleApiError,
  successResponse,
  notFoundResponse,
  forbiddenResponse,
} from '@/lib/api/error-handler'
import { getAuthContextOrThrow, RoleSets } from '@/lib/api/auth-helpers'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/planning/work-orders/[id]/copy-routing
 *
 * Manually copy routing operations to WO.
 * Admin-only endpoint for when automatic copy on release didn't happen
 * or was disabled via wo_copy_routing setting.
 *
 * Response format:
 * {
 *   success: true,
 *   data: {
 *     operations_created: number,
 *     message: string
 *   }
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 403: Insufficient permissions (not admin)
 * - 404: WO not found
 * - 500: Internal error
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication and require admin role
    const authContext = await getAuthContextOrThrow(supabase)

    // Verify admin role
    if (!RoleSets.ADMIN_ONLY.includes(authContext.userRole)) {
      return forbiddenResponse('Only administrators can manually trigger routing copy')
    }

    // Verify WO exists and get org_id (RLS handles org isolation)
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, org_id, routing_id, status')
      .eq('id', woId)
      .single()

    if (woError || !wo) {
      return notFoundResponse('Work order not found')
    }

    // Check if WO has a routing
    if (!wo.routing_id) {
      return successResponse(
        {
          operations_created: 0,
          message: 'Work order has no routing assigned. No operations copied.',
        },
        { message: 'No routing to copy' }
      )
    }

    // Copy routing to WO
    const operationsCreated = await WOOperationsService.copyRoutingToWO(
      supabase,
      woId,
      wo.org_id
    )

    // Determine response message based on result
    let message: string
    if (operationsCreated === 0) {
      // Could be because operations already exist (idempotent) or routing has no operations
      const { data: existingOps } = await supabase
        .from('wo_operations')
        .select('id')
        .eq('wo_id', woId)
        .limit(1)

      if (existingOps && existingOps.length > 0) {
        message = 'Operations already exist for this work order. No duplicates created.'
      } else {
        message = 'Routing has no operations to copy.'
      }
    } else {
      message = `Successfully copied ${operationsCreated} operation${operationsCreated === 1 ? '' : 's'} from routing.`
    }

    return successResponse(
      {
        operations_created: operationsCreated,
        message,
      },
      { message }
    )
  } catch (error) {
    return handleApiError(error, 'POST /api/planning/work-orders/[id]/copy-routing')
  }
}
