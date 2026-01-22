/**
 * GET /api/shipping/dashboard
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Returns KPIs for the shipping dashboard:
 * - Orders (total, by_status, trend)
 * - Pick Lists (total, by_status, trend)
 * - Shipments (total, by_status, trend)
 * - Backorders (count, total_value)
 * - On-time delivery percentage
 * - Average pick/pack times
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ShippingDashboardService } from '@/lib/services/shipping-dashboard-service'

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

    // Get user's org_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.org_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const orgId = profile.org_id

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const dateFromParam = searchParams.get('date_from')
    const dateToParam = searchParams.get('date_to')
    const dateRangePreset = searchParams.get('date_range')

    // Calculate date range
    let dateFrom: Date
    let dateTo: Date

    if (dateRangePreset) {
      const now = new Date()
      dateTo = now

      switch (dateRangePreset) {
        case 'today':
          dateFrom = new Date(now.setHours(0, 0, 0, 0))
          dateTo = new Date()
          break
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'last_7':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'last_30':
        default:
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }
    } else if (dateFromParam && dateToParam) {
      dateFrom = new Date(dateFromParam)
      dateTo = new Date(dateToParam)

      // Validate date range (max 365 days)
      const daysDiff = Math.ceil(
        (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff > 365) {
        return NextResponse.json(
          {
            error: 'Date range cannot exceed 365 days',
            code: 'INVALID_DATE_RANGE',
          },
          { status: 400 }
        )
      }
    } else {
      // Default to last 30 days
      dateTo = new Date()
      dateFrom = new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get KPIs from service
    const kpis = await ShippingDashboardService.getKPIs(orgId, dateFrom, dateTo)

    // Return response with cache headers
    const response = NextResponse.json(kpis)
    response.headers.set('Cache-Control', 'private, max-age=60')

    return response
  } catch (error) {
    console.error('Dashboard KPIs error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'DASHBOARD_KPI_ERROR',
      },
      { status: 500 }
    )
  }
}
