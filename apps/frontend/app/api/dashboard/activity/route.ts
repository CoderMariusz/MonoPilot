import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Dashboard Activity Feed API Route
 * Story: 1.13 Main Dashboard
 * Task 3: API Endpoints
 *
 * GET /api/dashboard/activity - Get recent activity logs
 */

export interface ActivityLog {
  id: string
  user_id: string
  activity_type: string
  entity_type: string
  entity_id: string
  entity_code: string
  description: string
  metadata: Record<string, any> | null
  created_at: string
  user?: {
    first_name: string
    last_name: string
    email: string
  }
}

export interface ActivityFeedResponse {
  activities: ActivityLog[]
  total_count: number
}

// ============================================================================
// GET /api/dashboard/activity - Get Recent Activity Logs (AC-012.3)
// ============================================================================

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

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const activityType = searchParams.get('activity_type')
    const entityType = searchParams.get('entity_type')

    // Validate limit (max 50)
    const safeLimit = Math.min(Math.max(limit, 1), 50)

    // Build query
    let query = supabase
      .from('activity_logs')
      .select(
        `
        id,
        user_id,
        activity_type,
        entity_type,
        entity_id,
        entity_code,
        description,
        metadata,
        created_at,
        user:users (
          first_name,
          last_name,
          email
        )
      `,
        { count: 'exact' }
      )
      .eq('org_id', currentUser.org_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + safeLimit - 1)

    // Apply activity_type filter
    if (activityType) {
      query = query.eq('activity_type', activityType)
    }

    // Apply entity_type filter
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    const { data: activities, error: queryError, count } = await query

    if (queryError) {
      console.error('Failed to fetch activity logs:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch activity logs' },
        { status: 500 }
      )
    }

    // Prepare response
    const response: ActivityFeedResponse = {
      activities: (activities || []) as ActivityLog[],
      total_count: count || 0,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/dashboard/activity:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
