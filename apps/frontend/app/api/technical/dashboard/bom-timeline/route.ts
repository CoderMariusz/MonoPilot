/**
 * GET /api/technical/dashboard/bom-timeline
 * Story 02.12 - BOM Timeline Endpoint
 * AC-12.13 to AC-12.16: BOM version changes over time
 * Cache TTL: 300 seconds (5 minutes)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { fetchBomTimeline } from '@/lib/services/dashboard-service'
import { z } from 'zod'

const querySchema = z.object({
  product_id: z.string().uuid().optional(),
  months: z.coerce.number().min(1).max(12).default(6),
  limit: z.coerce.number().min(1).max(100).default(50)
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
      product_id: searchParams.get('product_id') || undefined,
      months: searchParams.get('months') || 6,
      limit: searchParams.get('limit') || 50
    })

    if (!parseResult.success) {
      const errors = parseResult.error.errors
      const firstError = errors[0]

      if (firstError?.path.includes('months')) {
        return NextResponse.json(
          { error: 'Months must be between 1 and 12', code: 'INVALID_MONTHS' },
          { status: 400 }
        )
      }

      if (firstError?.path.includes('limit')) {
        return NextResponse.json(
          { error: 'Limit must be between 1 and 100', code: 'INVALID_LIMIT' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Invalid query parameters', code: 'INVALID_PARAMS' },
        { status: 400 }
      )
    }

    const { product_id, months, limit } = parseResult.data

    // Fetch timeline
    const timeline = await fetchBomTimeline(orgId, {
      productId: product_id,
      months,
      limit
    })

    // Return with cache header
    const response = NextResponse.json(timeline)
    response.headers.set('Cache-Control', 'private, max-age=300')

    return response
  } catch (error: any) {
    console.error('BOM timeline error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch BOM timeline', code: 'BOM_TIMELINE_FETCH_FAILED' },
      { status: 500 }
    )
  }
}
