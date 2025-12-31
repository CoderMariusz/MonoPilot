/**
 * API Route: /api/planning/work-orders
 * Story 03.10: Work Order CRUD - List and Create
 *
 * Refactored to use standardized error handling and auth helpers
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WorkOrderService } from '@/lib/services/work-order-service'
import { createWOSchema, woListQuerySchema } from '@/lib/validation/work-order'
import { handleApiError, successResponse } from '@/lib/api/error-handler'
import { getAuthContextOrThrow, getAuthContextWithRole, RoleSets } from '@/lib/api/auth-helpers'

// GET /api/planning/work-orders - List work orders with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication and get org context
    const { orgId } = await getAuthContextOrThrow(supabase)

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const params = woListQuerySchema.parse(searchParams)

    // Call service
    const result = await WorkOrderService.list(supabase, orgId, params)

    return successResponse(result.data, { meta: result.pagination })
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders')
  }
}

// POST /api/planning/work-orders - Create new work order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication and permissions
    const { orgId, userId } = await getAuthContextWithRole(supabase, RoleSets.WORK_ORDER_WRITE)

    // Parse and validate request body
    const body = await request.json()
    const validated = createWOSchema.parse(body)

    // Create work order
    const workOrder = await WorkOrderService.create(supabase, orgId, userId, validated)

    return successResponse(workOrder, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/planning/work-orders')
  }
}
