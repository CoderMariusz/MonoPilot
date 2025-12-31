/**
 * API Route: /api/planning/work-orders/[id]/release
 * Story 03.10: Release work order (planned -> released)
 *
 * Refactored to use standardized error handling and auth helpers
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WorkOrderService } from '@/lib/services/work-order-service'
import { statusTransitionSchema } from '@/lib/validation/work-order'
import { handleApiError, successResponse } from '@/lib/api/error-handler'
import { getAuthContextWithRole, RoleSets } from '@/lib/api/auth-helpers'

// POST /api/planning/work-orders/[id]/release
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication and permissions
    const { userId } = await getAuthContextWithRole(supabase, RoleSets.WORK_ORDER_TRANSITION)

    // Parse optional notes from body
    let notes: string | undefined
    try {
      const body = await request.json()
      const validated = statusTransitionSchema.parse(body)
      notes = validated.notes ?? undefined
    } catch {
      // Body is optional, continue without notes
    }

    // Release work order
    const workOrder = await WorkOrderService.release(supabase, id, userId, notes)

    return successResponse(workOrder)
  } catch (error) {
    return handleApiError(error, 'POST /api/planning/work-orders/[id]/release')
  }
}
