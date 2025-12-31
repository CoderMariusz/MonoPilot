/**
 * API Route: /api/planning/work-orders/[wo_id]/operations/[op_id]
 * Story 03.12: WO Operations (Routing Copy)
 *
 * GET /api/planning/work-orders/:wo_id/operations/:op_id - Get single operation detail with variances
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WOOperationsService } from '@/lib/services/wo-operations-service'
import { handleApiError, successResponse, notFoundResponse } from '@/lib/api/error-handler'
import { getAuthContextOrThrow } from '@/lib/api/auth-helpers'

// GET /api/planning/work-orders/[wo_id]/operations/[op_id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wo_id: string; op_id: string }> }
) {
  try {
    const { wo_id, op_id } = await params
    const supabase = await createServerSupabase()

    // Check authentication (role check done via RLS)
    await getAuthContextOrThrow(supabase)

    // Get operation detail
    const operation = await WOOperationsService.getOperationById(supabase, wo_id, op_id)

    if (!operation) {
      return notFoundResponse('Operation not found')
    }

    return successResponse(operation)
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders/[wo_id]/operations/[op_id]')
  }
}
