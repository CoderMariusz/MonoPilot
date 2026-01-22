/**
 * GET /api/shipping/dashboard/recent-activity
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Returns recent activity for the shipping dashboard:
 * - Sales order events
 * - Pick list events
 * - Shipment events
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
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    // Validate limit
    let limit = 10
    if (limitParam) {
      limit = parseInt(limitParam, 10)
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json(
          {
            error: 'Invalid limit parameter',
            code: 'INVALID_LIMIT',
          },
          { status: 400 }
        )
      }
      if (limit > 50) {
        return NextResponse.json(
          {
            error: 'Limit cannot exceed 50',
            code: 'INVALID_LIMIT',
          },
          { status: 400 }
        )
      }
    }

    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    // Get recent activity from service
    const activities = await ShippingDashboardService.getRecentActivity(orgId, limit)

    // Return response with pagination
    const response = NextResponse.json({
      activities,
      pagination: {
        total: activities.length,
        limit,
        offset,
      },
    })
    response.headers.set('Cache-Control', 'private, max-age=30')

    return response
  } catch (error) {
    console.error('Dashboard recent activity error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'DASHBOARD_ACTIVITY_ERROR',
      },
      { status: 500 }
    )
  }
}
