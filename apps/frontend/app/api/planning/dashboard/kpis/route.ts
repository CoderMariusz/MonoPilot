/**
 * API Route: Planning Dashboard KPIs
 * Story: 03.16 - Planning Dashboard
 *
 * GET /api/planning/dashboard/kpis - Get dashboard KPI metrics
 *
 * KPIs returned:
 * - po_pending_approval: POs awaiting approval
 * - po_this_month: POs created this month
 * - to_in_transit: Transfer orders in transit
 * - wo_scheduled_today: Work orders scheduled for today
 * - wo_overdue: Overdue work orders
 * - open_orders: Total open purchase orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getKPIs } from '@/lib/services/planning-dashboard-service'
import { dashboardKPIQuerySchema } from '@/lib/validation/planning-dashboard-schemas'

/**
 * GET /api/planning/dashboard/kpis
 * Returns KPI metrics for the planning dashboard
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

    // Validate query parameters if provided (org_id from URL takes precedence if valid)
    const searchParams = request.nextUrl.searchParams
    const queryOrgId = searchParams.get('org_id')

    if (queryOrgId) {
      // Validate the query org_id format
      const parsed = dashboardKPIQuerySchema.safeParse({ org_id: queryOrgId })
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid org_id format' },
          { status: 400 }
        )
      }

      // Ensure user can only access their own org's data (RLS)
      if (queryOrgId !== orgId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Get KPIs
    const kpis = await getKPIs(orgId)

    // Set cache headers (2 minute cache)
    const response = NextResponse.json(kpis)
    response.headers.set('Cache-Control', 'private, max-age=120')
    response.headers.set('X-Cache-TTL', '120')

    return response
  } catch (error) {
    console.error('Error in GET /api/planning/dashboard/kpis:', error)

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
