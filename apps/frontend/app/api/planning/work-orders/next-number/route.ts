/**
 * API Route: /api/planning/work-orders/next-number
 * Story 03.10: Preview next WO number without creating
 *
 * Refactored to use standardized error handling and auth helpers
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WorkOrderService } from '@/lib/services/work-order-service'
import { handleApiError, successResponse } from '@/lib/api/error-handler'
import { getAuthContextOrThrow } from '@/lib/api/auth-helpers'

// GET /api/planning/work-orders/next-number?date=yyyy-mm-dd (optional)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { orgId } = await getAuthContextOrThrow(supabase)

    // Parse optional date parameter
    const dateParam = request.nextUrl.searchParams.get('date')
    const date = dateParam ? new Date(dateParam) : undefined

    // Preview next WO number
    const woNumber = await WorkOrderService.previewNextNumber(supabase, orgId, date)

    return successResponse({ wo_number: woNumber })
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders/next-number')
  }
}
