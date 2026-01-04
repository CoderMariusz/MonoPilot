/**
 * API Route: Warehouse Dashboard Activity
 * Story: 05.7 - Warehouse Dashboard
 *
 * GET /api/warehouse/dashboard/activity - Get recent LP operations
 *
 * Query Parameters:
 * - limit: Number of activities to return (default 20, max 50)
 *
 * Returns array of recent LP operations (create, consume, split, merge, move)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getRecentActivity } from '@/lib/services/warehouse-dashboard-service'
import { warehouseDashboardActivityQuerySchema } from '@/lib/validation/warehouse-dashboard-schemas'

/**
 * GET /api/warehouse/dashboard/activity
 * Returns recent activity for the warehouse dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication first
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

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const rawLimit = searchParams.get('limit')

    const validationResult = warehouseDashboardActivityQuerySchema.safeParse({
      limit: rawLimit ? parseInt(rawLimit, 10) : undefined,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.format(),
        },
        { status: 400 }
      )
    }

    const { limit } = validationResult.data

    // Get recent activity
    const activities = await getRecentActivity(orgId, limit)

    // No cache for activity (real-time data)
    const response = NextResponse.json({ activities })
    response.headers.set('Cache-Control', 'no-cache')

    return response
  } catch (error) {
    console.error('Error in GET /api/warehouse/dashboard/activity:', error)

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
