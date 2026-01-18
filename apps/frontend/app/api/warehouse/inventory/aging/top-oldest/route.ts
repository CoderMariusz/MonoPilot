/**
 * API Route: Top Oldest Stock
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab - Widget)
 *
 * GET /api/warehouse/inventory/aging/top-oldest - Get top N oldest stock items
 *
 * Query Parameters:
 * - mode: 'fifo' | 'fefo' (default: 'fifo')
 * - limit: number (default: 10, max: 50)
 *
 * Response: OldestStockItem[]
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { topOldestQuerySchema } from '@/lib/validation/aging-report-schema'
import { AgingReportService } from '@/lib/services/aging-report-service'
import { ZodError } from 'zod'

/**
 * GET /api/warehouse/inventory/aging/top-oldest
 * Returns top N oldest stock items (FIFO) or soonest expiring (FEFO)
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
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const orgId = userData.org_id

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const rawParams = {
      mode: searchParams.get('mode') || 'fifo',
      limit: searchParams.get('limit') || '10',
    }

    let validatedParams

    try {
      validatedParams = topOldestQuerySchema.parse(rawParams)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        )
      }
      throw error
    }

    // Get top oldest stock
    const items = await AgingReportService.getTopOldestStock(
      orgId,
      validatedParams.mode,
      validatedParams.limit
    )

    // Set cache headers (60 second cache)
    const response = NextResponse.json(items)
    response.headers.set('Cache-Control', 'private, max-age=60')
    response.headers.set('X-Cache-TTL', '60')

    return response
  } catch (error) {
    console.error('Error in GET /api/warehouse/inventory/aging/top-oldest:', error)

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
