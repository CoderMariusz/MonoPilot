/**
 * API Route: Planning Dashboard Activity Feed
 * Story: 03.16 - Planning Dashboard
 *
 * GET /api/planning/dashboard/activity - Get recent activity
 *
 * Activity types:
 * - PO created, updated, approved, cancelled, completed
 * - TO created, updated, cancelled, completed
 * - WO created, updated, cancelled, completed
 *
 * Query parameters:
 * - limit: Number of activities to return (default 20, max 100)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getRecentActivity } from '@/lib/services/planning-dashboard-service'
import { dashboardActivityQuerySchema } from '@/lib/validation/planning-dashboard-schemas'

/**
 * GET /api/planning/dashboard/activity
 * Returns recent activity for the planning dashboard
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

    // Get user's org_id from session
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

    // Parse and validate query parameters (limit only)
    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get('limit')

    const queryObj: Record<string, unknown> = {}
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10)
      if (isNaN(parsedLimit)) {
        return NextResponse.json(
          { error: 'Invalid query parameters: limit must be a number' },
          { status: 400 }
        )
      }
      queryObj.limit = parsedLimit
    }

    // Validate query parameters
    const parsed = dashboardActivityQuerySchema.safeParse(queryObj)
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json(
        { error: `Invalid query parameters: ${errors}` },
        { status: 400 }
      )
    }

    // Get activity
    const activity = await getRecentActivity(orgId, parsed.data.limit)

    // Set cache headers (2 minute cache)
    const response = NextResponse.json(activity)
    response.headers.set('Cache-Control', 'private, max-age=120')
    response.headers.set('X-Cache-TTL', '120')

    return response
  } catch (error) {
    console.error('Error in GET /api/planning/dashboard/activity:', error)

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

/**
 * POST method not allowed
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  )
}

/**
 * PUT method not allowed
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  )
}

/**
 * DELETE method not allowed
 */
export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  )
}

/**
 * PATCH method not allowed
 */
export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  )
}
