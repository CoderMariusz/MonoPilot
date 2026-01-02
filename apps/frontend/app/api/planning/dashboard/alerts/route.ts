/**
 * API Route: Planning Dashboard Alerts
 * Story: 03.16 - Planning Dashboard
 *
 * GET /api/planning/dashboard/alerts - Get dashboard alerts
 *
 * Alert types:
 * - overdue_po: Purchase orders past expected delivery date
 * - pending_approval: POs awaiting approval for more than 2 days
 *
 * Query parameters:
 * - limit: Number of alerts to return (default 10, max 50)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAlerts } from '@/lib/services/planning-dashboard-service'
import { dashboardAlertsQuerySchema } from '@/lib/validation/planning-dashboard-schemas'

/**
 * GET /api/planning/dashboard/alerts
 * Returns alerts for the planning dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's org_id
    const { data: userData, error: orgError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (orgError || !userData?.org_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const orgId = userData.org_id

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get('limit')
    const queryOrgId = searchParams.get('org_id')

    // Build query object for validation
    const queryObj: Record<string, unknown> = { org_id: queryOrgId || orgId }
    if (limitParam) {
      queryObj.limit = parseInt(limitParam, 10)
    }

    // Validate query parameters
    const parsed = dashboardAlertsQuerySchema.safeParse(queryObj)
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json(
        { error: `Invalid query parameters: ${errors}` },
        { status: 400 }
      )
    }

    // Ensure user can only access their own org's data (RLS)
    if (queryOrgId && queryOrgId !== orgId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get alerts
    const alerts = await getAlerts(orgId, parsed.data.limit)

    // Set cache headers (2 minute cache)
    const response = NextResponse.json(alerts)
    response.headers.set('Cache-Control', 'private, max-age=120')
    response.headers.set('X-Cache-TTL', '120')

    return response
  } catch (error) {
    console.error('Error in GET /api/planning/dashboard/alerts:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
          debug: error instanceof Error ? error.message : 'Unknown error',
        }),
      },
      { status: 500 }
    )
  }
}
