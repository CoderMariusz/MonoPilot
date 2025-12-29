/**
 * GET /api/technical/dashboard/stats
 * Story 02.12 - Technical Dashboard Stats Endpoint
 * AC-12.01 to AC-12.05: Stats cards with Products, BOMs, Routings, Avg Cost
 * Cache TTL: 60 seconds
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { fetchDashboardStats } from '@/lib/services/dashboard-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get current user's org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser?.org_id) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    const orgId = currentUser.org_id

    // Fetch stats
    const stats = await fetchDashboardStats(orgId)

    // Return with cache header
    const response = NextResponse.json(stats)
    response.headers.set('Cache-Control', 'private, max-age=60')

    return response
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics', code: 'STATS_FETCH_FAILED' },
      { status: 500 }
    )
  }
}
