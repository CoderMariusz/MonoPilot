/**
 * Quality Holds Active List API Route
 * Story: 06.2 - Quality Holds CRUD
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/holds/active - Get active holds with aging summary
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.2.quality-holds-crud.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import * as QualityHoldService from '@/lib/services/quality-hold-service'
import { getAuthenticatedOrgId, handleError } from '@/lib/utils/api-helpers'

/**
 * GET /api/quality/holds/active
 * Get active holds with aging summary
 *
 * Response:
 * - 200: { holds: QualityHoldSummary[], aging_summary: { normal, warning, critical } }
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedOrgId()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active holds
    const result = await QualityHoldService.getActiveHolds(auth.orgId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/quality/holds/active:', error)
    return handleError(error)
  }
}
