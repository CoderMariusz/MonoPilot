/**
 * API Route: /api/planning/work-orders/[id]/history
 * Story 03.10: Get work order status history
 *
 * Refactored to use standardized error handling and auth helpers
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WorkOrderService } from '@/lib/services/work-order-service'
import { handleApiError, successResponse, notFoundResponse } from '@/lib/api/error-handler'
import { getAuthContextOrThrow } from '@/lib/api/auth-helpers'

// GET /api/planning/work-orders/[id]/history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication (RLS handles org isolation)
    await getAuthContextOrThrow(supabase)

    // Verify work order exists and user has access
    const workOrder = await WorkOrderService.getById(supabase, id)

    if (!workOrder) {
      return notFoundResponse('Work order not found')
    }

    // Get status history
    const history = await WorkOrderService.getStatusHistory(supabase, id)

    return successResponse(history)
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders/[id]/history')
  }
}
