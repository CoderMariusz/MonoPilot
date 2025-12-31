import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createProductionLineSchema,
  productionLineFiltersSchema,
  type ProductionLineFilters,
} from '@/lib/validation/production-line-schemas'
import {
  createProductionLine,
  listProductionLines,
} from '@/lib/services/production-line-service'
import { ZodError } from 'zod'

/**
 * Production Line API Routes
 * Story: 1.8 Production Line Configuration
 * Task 4: API Endpoints
 *
 * GET /api/settings/lines - List production lines with filters
 * POST /api/settings/lines - Create new production line
 *
 * TODO (Story 1.14): Add rate limiting to prevent API abuse
 * - Implement using @upstash/ratelimit with Redis
 * - Recommended limits:
 *   • GET /api/settings/lines: 60 req/min per user
 *   • POST /api/settings/lines: 10 req/min per user (admin only)
 * - Handle rate limit errors with 429 Too Many Requests
 * - Include Retry-After header in response
 *
 * Example implementation:
 * ```typescript
 * import { Ratelimit } from "@upstash/ratelimit"
 * import { Redis } from "@upstash/redis"
 *
 * const ratelimit = new Ratelimit({
 *   redis: Redis.fromEnv(),
 *   limiter: Ratelimit.slidingWindow(10, "1 m"),
 * })
 *
 * const { success } = await ratelimit.limit(userId)
 * if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
 * ```
 */

// ============================================================================
// GET /api/settings/lines - List Production Lines (AC-007.4)
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

    // Get current user to check role and org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Note: GET is allowed for all authenticated users (view lines)
    // Admin restriction only applies to POST/PUT/DELETE

    // Parse query parameters for filtering and sorting (AC-007.4)
    const searchParams = request.nextUrl.searchParams
    const warehouseId = searchParams.get('warehouse_id')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort_by')
    const sortDirection = searchParams.get('sort_direction')

    // Validate filters
    const filters: ProductionLineFilters = productionLineFiltersSchema.parse({
      warehouse_id: warehouseId || undefined,
      search: search || undefined,
      sort_by: sortBy || undefined,
      sort_direction: sortDirection || undefined,
    })

    // Call service method
    const result = await listProductionLines(filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch production lines' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        lines: result.data || [],
        total: result.total || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/settings/lines:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/settings/lines - Create Production Line (AC-007.1)
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization: Admin only (AC-007.1)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createProductionLineSchema.parse(body)

    // Call service method
    const result = await createProductionLine(validatedData)

    if (!result.success) {
      // Handle specific error messages
      if (result.error?.includes('unique') || result.error?.includes('already exists')) {
        return NextResponse.json(
          { error: result.error || 'Production line code already exists' },
          { status: 409 }
        )
      }

      if (result.error?.includes('warehouse') && result.error?.includes('location')) {
        return NextResponse.json(
          { error: result.error || 'Output location must be within the selected warehouse' },
          { status: 400 }
        )
      }

      if (result.error?.includes('Invalid') || result.error?.includes('invalid')) {
        return NextResponse.json(
          { error: result.error || 'Invalid input' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to create production line' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        line: result.data,
        message: 'Production line created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/settings/lines:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
