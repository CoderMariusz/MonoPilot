/**
 * API Route: /api/planning/work-orders/bom-for-date
 * Story 03.10: Get auto-selected BOM for product on scheduled date
 *
 * Refactored to use standardized error handling and auth helpers
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WorkOrderService } from '@/lib/services/work-order-service'
import { bomForDateSchema } from '@/lib/validation/work-order'
import { handleApiError, successResponse } from '@/lib/api/error-handler'
import { getAuthContextOrThrow } from '@/lib/api/auth-helpers'

// GET /api/planning/work-orders/bom-for-date?product_id=xxx&scheduled_date=yyyy-mm-dd
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { orgId } = await getAuthContextOrThrow(supabase)

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const validated = bomForDateSchema.parse(searchParams)

    // Get auto-selected BOM
    const bom = await WorkOrderService.getActiveBomForDate(
      supabase,
      validated.product_id,
      orgId,
      new Date(validated.scheduled_date)
    )

    return successResponse(bom) // null if no BOM found
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders/bom-for-date')
  }
}
