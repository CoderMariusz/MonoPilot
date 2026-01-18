/**
 * API Route: Expiring Inventory
 * Story: 05.28 - Expiry Alerts Dashboard
 * Extended for: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * GET /api/warehouse/inventory/expiring - List expiring LPs with pagination
 *
 * Query Parameters:
 * - days: number (default: 30, min: 1, max: 365) - threshold for expiring items
 * - warehouse_id: UUID (optional) - filter by warehouse
 * - location_id: UUID (optional) - filter by location
 * - product_id: UUID (optional) - filter by product
 * - tier: 'expired' | 'critical' | 'warning' | 'ok' | 'all' (default: 'all')
 * - page: number (default: 1) - page number
 * - limit: number (default: 50, max: 100) - items per page
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getExpiringWithPagination } from '@/lib/services/expiry-alert-service'
import { expiringItemsQuerySchema } from '@/lib/validation/expiry-alert-schema'

/**
 * GET /api/warehouse/inventory/expiring
 * Returns paginated list of expiring LPs with summary
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData, error: orgError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (orgError || !userData?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const orgId = userData.org_id

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      days: searchParams.get('days'),
      warehouse_id: searchParams.get('warehouse_id'),
      location_id: searchParams.get('location_id'),
      product_id: searchParams.get('product_id'),
      tier: searchParams.get('tier'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    }

    const validationResult = expiringItemsQuerySchema.safeParse(queryParams)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { days, warehouse_id, location_id, product_id, tier, page, limit } =
      validationResult.data

    // Get expiring items with pagination
    const result = await getExpiringWithPagination(
      orgId,
      days,
      {
        warehouse_id,
        location_id,
        product_id,
        tier,
      },
      {
        page,
        limit,
      }
    )

    // Set cache headers (5 minutes cache)
    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'private, max-age=300')
    response.headers.set('X-Cache-TTL', '300')

    return response
  } catch (error) {
    console.error('Error in GET /api/warehouse/inventory/expiring:', error)

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
