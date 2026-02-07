/**
 * GET /api/shipping/dashboard/alerts
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Returns alerts for the shipping dashboard:
 * - Backorders
 * - Delayed shipments
 * - Pending picks overdue
 * - Allergen conflicts
 * - Alert summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ShippingDashboardService } from '@/lib/services/shipping-dashboard-service'
import { getOrgContext } from '@/lib/services/org-context-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id using the org-context-service (single source of truth)
    const context = await getOrgContext(user.id, supabase)
    const orgId = context.org_id

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const severity = searchParams.get('severity') // critical, warning, info, all

    // Calculate date range (default to last 30 days)
    const dateTo = new Date()
    const dateFrom = new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get alerts from service
    const alerts = await ShippingDashboardService.getAlerts(orgId, dateFrom, dateTo)

    // Filter by severity if specified
    if (severity && severity !== 'all') {
      // For now, return all alerts but could filter based on severity
    }

    // Return response with cache headers
    const response = NextResponse.json(alerts)
    response.headers.set('Cache-Control', 'private, max-age=60')

    return response
  } catch (error) {
    console.error('Dashboard alerts error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'DASHBOARD_ALERTS_ERROR',
      },
      { status: 500 }
    )
  }
}
