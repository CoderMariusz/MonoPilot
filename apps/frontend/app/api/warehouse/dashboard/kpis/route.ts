/**
 * API Route: Warehouse Dashboard KPIs
 * Story: 05.7 - Warehouse Dashboard
 *
 * GET /api/warehouse/dashboard/kpis - Get dashboard KPI metrics
 *
 * KPIs returned:
 * - total_lps: Total active license plates (not consumed)
 * - available_lps: Available LPs (status='available' AND qa_status='passed')
 * - reserved_lps: Reserved LPs (active reservations)
 * - consumed_today: LPs consumed today
 * - expiring_soon: LPs expiring within 30 days
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getDashboardKPIs } from '@/lib/services/warehouse-dashboard-service'

/**
 * GET /api/warehouse/dashboard/kpis
 * Returns KPI metrics for the warehouse dashboard
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

    // Get KPIs
    const kpis = await getDashboardKPIs(orgId)

    // Set cache headers (1 minute cache)
    const response = NextResponse.json(kpis)
    response.headers.set('Cache-Control', 'private, max-age=60')
    response.headers.set('X-Cache-TTL', '60')

    return response
  } catch (error) {
    console.error('Error in GET /api/warehouse/dashboard/kpis:', error)

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
