/**
 * API Route: /api/planning/work-orders/[id]/schedule
 * Story 03.14: Schedule work order (dates, times, line, machine)
 *
 * Updates WO scheduling information without changing status
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WorkOrderService } from '@/lib/services/work-order-service'
import { scheduleWOSchema } from '@/lib/validation/work-order-schemas'
import { handleApiError, successResponse } from '@/lib/api/error-handler'
import { getAuthContextWithRole, RoleSets } from '@/lib/api/auth-helpers'

// PATCH /api/planning/work-orders/[id]/schedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication and permissions
    const context = await getAuthContextWithRole(supabase, RoleSets.WORK_ORDER_WRITE)

    // Parse and validate body
    const body = await request.json()
    const validated = scheduleWOSchema.parse(body)

    // Schedule work order
    const workOrder = await WorkOrderService.scheduleWorkOrder(
      supabase,
      context.orgId,
      id,
      context.userId,
      validated
    )

    return successResponse(workOrder)
  } catch (error) {
    return handleApiError(error, 'PATCH /api/planning/work-orders/[id]/schedule')
  }
}
