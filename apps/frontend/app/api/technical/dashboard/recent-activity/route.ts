// GET /api/technical/dashboard/recent-activity - Recent Activity API
// Story 02.12 (AC-12.17 to AC-12.19): Products, BOMs, Routings activity
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { fetchRecentActivity } from '@/lib/services/dashboard-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to get org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser?.org_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const orgId = currentUser.org_id

    // Get limit from query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch Story 02.12 activity format
    const result = await fetchRecentActivity(orgId, limit)

    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'private, max-age=30')
    return response
  } catch (error: any) {
    console.error('Recent activity error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
