/**
 * API Route: /api/planning/work-orders/[id]/operations/[opId]
 * Story 03.12: WO Operations (Routing Copy)
 *
 * GET /api/planning/work-orders/:id/operations/:opId - Get single operation detail
 *
 * Returns full operation details including:
 * - Instructions
 * - Machine/Line data
 * - Duration and yield variances
 * - User info for started_by/completed_by
 *
 * Security: Auth required, RLS enforces org isolation
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WOOperationsService } from '@/lib/services/wo-operations-service'
import { handleApiError, successResponse, notFoundResponse } from '@/lib/api/error-handler'
import { getAuthContextOrThrow } from '@/lib/api/auth-helpers'

interface RouteParams {
  params: Promise<{
    id: string
    opId: string
  }>
}

/**
 * GET /api/planning/work-orders/[id]/operations/[opId]
 *
 * Returns single operation with full details and calculated variances.
 *
 * Response format:
 * {
 *   success: true,
 *   data: WOOperationDetail
 * }
 *
 * Error responses:
 * - 401: Not authenticated
 * - 404: WO or operation not found (also for cross-org access)
 * - 500: Internal error
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: woId, opId } = await params
    const supabase = await createServerSupabase()

    // Check authentication (RLS handles org isolation)
    await getAuthContextOrThrow(supabase)

    // Get operation detail
    const operation = await WOOperationsService.getOperationById(supabase, woId, opId)

    if (!operation) {
      return notFoundResponse('Operation not found')
    }

    return successResponse(operation)
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders/[id]/operations/[opId]')
  }
}
