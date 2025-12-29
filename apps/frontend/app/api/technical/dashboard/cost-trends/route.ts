/**
 * GET /api/technical/dashboard/cost-trends
 * Story 02.12 - Cost Trends Endpoint
 * AC-12.20 to AC-12.22: Monthly cost averages for chart
 * Cache TTL: 300 seconds (5 minutes)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { fetchCostTrends } from '@/lib/services/dashboard-service'
import { z } from 'zod'

const querySchema = z.object({
  months: z.coerce.number().min(1).max(12).default(6)
})

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

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const parseResult = querySchema.safeParse({
      months: searchParams.get('months') || 6
    })

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Months must be between 1 and 12', code: 'INVALID_MONTHS' },
        { status: 400 }
      )
    }

    const { months } = parseResult.data

    // Fetch cost trends
    const costTrends = await fetchCostTrends(orgId, months)

    // Return with cache header
    const response = NextResponse.json(costTrends)
    response.headers.set('Cache-Control', 'private, max-age=300')

    return response
  } catch (error: any) {
    console.error('Cost trends error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost trends', code: 'COST_TRENDS_FETCH_FAILED' },
      { status: 500 }
    )
  }
}
