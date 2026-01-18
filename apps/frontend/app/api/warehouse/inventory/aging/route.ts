/**
 * API Route: Aging Report
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * GET /api/warehouse/inventory/aging - Get aging report (FIFO/FEFO)
 *
 * Query Parameters:
 * - mode: 'fifo' | 'fefo' (default: 'fifo')
 * - warehouse_id: UUID (optional)
 * - product_category_id: UUID (optional)
 * - limit: number (default: 50, max: 100)
 *
 * Response:
 * {
 *   mode: 'fifo' | 'fefo',
 *   data: ProductAgingData[],
 *   summary: AgingSummary
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { agingReportQuerySchema } from '@/lib/validation/aging-report-schema'
import { AgingReportService } from '@/lib/services/aging-report-service'
import { ZodError } from 'zod'

/**
 * GET /api/warehouse/inventory/aging
 * Returns aging report with FIFO or FEFO mode
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
      warehouse_id: searchParams.get('warehouse_id') || undefined,
      product_category_id: searchParams.get('product_category_id') || undefined,
      limit: searchParams.get('limit') || '50',
    }

    let validatedParams

    try {
      validatedParams = agingReportQuerySchema.parse(rawParams)
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

    // Get aging report
    const report = await AgingReportService.getAgingReport(orgId, validatedParams.mode, {
      warehouse_id: validatedParams.warehouse_id,
      product_category_id: validatedParams.product_category_id,
      limit: validatedParams.limit,
    })

    // Set cache headers (60 second cache for aging data)
    const response = NextResponse.json(report)
    response.headers.set('Cache-Control', 'private, max-age=60')
    response.headers.set('X-Cache-TTL', '60')

    return response
  } catch (error) {
    console.error('Error in GET /api/warehouse/inventory/aging:', error)

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
