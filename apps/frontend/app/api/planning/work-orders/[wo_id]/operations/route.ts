/**
 * API Route: /api/planning/work-orders/[wo_id]/operations
 * Story 03.12: WO Operations (Routing Copy)
 *
 * GET /api/planning/work-orders/:wo_id/operations - List WO operations ordered by sequence
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WOOperationsService } from '@/lib/services/wo-operations-service'
import { handleApiError, successResponse, notFoundResponse } from '@/lib/api/error-handler'
import { getAuthContextOrThrow } from '@/lib/api/auth-helpers'

// GET /api/planning/work-orders/[wo_id]/operations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wo_id: string }> }
) {
  try {
    const { wo_id } = await params
    const supabase = await createServerSupabase()

    // Check authentication (role check done via RLS)
    await getAuthContextOrThrow(supabase)

    // Get operations for WO
    const result = await WOOperationsService.getOperationsForWO(supabase, wo_id)

    return successResponse({
      operations: result.operations,
      total: result.total,
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders/[wo_id]/operations')
  }
}
