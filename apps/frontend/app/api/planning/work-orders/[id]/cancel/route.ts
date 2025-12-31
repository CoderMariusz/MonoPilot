/**
 * API Route: /api/planning/work-orders/[id]/cancel
 * Story 03.10: Cancel work order
 *
 * Refactored to use standardized error handling and auth helpers
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WorkOrderService } from '@/lib/services/work-order-service'
import { cancelWOSchema } from '@/lib/validation/work-order'
import { handleApiError, successResponse } from '@/lib/api/error-handler'
import { getAuthContextWithRole, RoleSets } from '@/lib/api/auth-helpers'

// POST /api/planning/work-orders/[id]/cancel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication and permissions
    const { userId } = await getAuthContextWithRole(supabase, RoleSets.WORK_ORDER_TRANSITION)

    // Parse optional reason from body
    let reason: string | undefined
    try {
      const body = await request.json()
      const validated = cancelWOSchema.parse(body)
      reason = validated.reason ?? undefined
    } catch {
      // Body is optional, continue without reason
    }

    // Cancel work order
    const workOrder = await WorkOrderService.cancel(supabase, id, userId, reason)

    return successResponse(workOrder)
  } catch (error) {
    return handleApiError(error, 'POST /api/planning/work-orders/[id]/cancel')
  }
}
