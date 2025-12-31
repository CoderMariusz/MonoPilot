/**
 * API Route: /api/planning/work-orders/[id]/operations
 * Story 03.12: WO Operations (Routing Copy)
 *
 * GET /api/planning/work-orders/:id/operations - List WO operations ordered by sequence
 *
 * NOTE: This route uses [id] parameter. The [wo_id] version is also available.
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WOOperationsService } from '@/lib/services/wo-operations-service'
import { handleApiError, successResponse } from '@/lib/api/error-handler'
import { getAuthContextOrThrow } from '@/lib/api/auth-helpers'

// GET /api/planning/work-orders/[id]/operations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication (role check done via RLS)
    await getAuthContextOrThrow(supabase)

    // Get operations for WO
    const result = await WOOperationsService.getOperationsForWO(supabase, id)

    return successResponse({
      operations: result.operations,
      total: result.total,
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders/[id]/operations')
  }
}
