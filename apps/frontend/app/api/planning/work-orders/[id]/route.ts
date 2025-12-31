/**
 * API Route: /api/planning/work-orders/[id]
 * Story 03.10: Work Order CRUD - Get, Update, Delete single WO
 *
 * Refactored to use standardized error handling and auth helpers
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WorkOrderService } from '@/lib/services/work-order-service'
import { updateWOSchema } from '@/lib/validation/work-order'
import { handleApiError, successResponse, notFoundResponse } from '@/lib/api/error-handler'
import { getAuthContextOrThrow, getAuthContextWithRole, RoleSets } from '@/lib/api/auth-helpers'

// GET /api/planning/work-orders/[id] - Get single work order with relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Verify authentication (RLS enforces org isolation)
    await getAuthContextOrThrow(supabase)

    // Get work order
    const workOrder = await WorkOrderService.getById(supabase, id)

    if (!workOrder) {
      return notFoundResponse('Work order not found')
    }

    return successResponse(workOrder)
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders/[id]')
  }
}

// PUT /api/planning/work-orders/[id] - Update work order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication and permissions
    const { userId } = await getAuthContextWithRole(supabase, RoleSets.WORK_ORDER_WRITE)

    // Parse and validate request body
    const body = await request.json()
    const validated = updateWOSchema.parse(body)

    // Update work order
    const workOrder = await WorkOrderService.update(supabase, id, userId, validated)

    return successResponse(workOrder)
  } catch (error) {
    return handleApiError(error, 'PUT /api/planning/work-orders/[id]')
  }
}

// DELETE /api/planning/work-orders/[id] - Delete draft work order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication and permissions (delete is more restricted)
    await getAuthContextWithRole(supabase, RoleSets.WORK_ORDER_DELETE)

    // Delete work order (service validates draft status)
    await WorkOrderService.delete(supabase, id)

    return successResponse(undefined, { message: 'Work order deleted successfully' })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/planning/work-orders/[id]')
  }
}
