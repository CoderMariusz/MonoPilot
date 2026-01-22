/**
 * Quality Holds Stats API Route
 * Story: 06.2 - Quality Holds CRUD
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/holds/stats - Get hold statistics for dashboard
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.2.quality-holds-crud.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import * as QualityHoldService from '@/lib/services/quality-hold-service'
import { getAuthenticatedOrgId, handleError } from '@/lib/utils/api-helpers'

/**
 * GET /api/quality/holds/stats
 * Get hold statistics for dashboard
 *
 * Response:
 * - 200: HoldStatsResponse
 *   - active_count: number
 *   - released_today: number
 *   - aging_critical: number
 *   - by_priority: { low, medium, high, critical }
 *   - by_type: { qa_pending, investigation, recall, quarantine }
 *   - avg_resolution_time_hours: number
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedOrgId()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get hold stats
    const result = await QualityHoldService.getHoldsStats(auth.orgId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/quality/holds/stats:', error)
    return handleError(error)
  }
}
