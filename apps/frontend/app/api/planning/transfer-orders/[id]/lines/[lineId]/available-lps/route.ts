/**
 * API Route: Get Available LPs for TO Line
 * Story: 03.9b - TO License Plate Pre-selection
 *
 * GET /api/planning/transfer-orders/:id/lines/:lineId/available-lps
 *
 * Gets available License Plates for a Transfer Order line.
 * Filters by warehouse, product, and excludes:
 * - LPs already assigned to other TOs
 * - Expired LPs
 * - LPs with zero available quantity
 * - LPs with status other than 'available'
 *
 * Query Parameters:
 * - lot_number: Filter by lot number (partial match)
 * - expiry_from: Filter by expiry date >= (YYYY-MM-DD)
 * - expiry_to: Filter by expiry date <= (YYYY-MM-DD)
 * - search: Search by LP number (partial match)
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     lps: Array<AvailableLP>,
 *     total_count: number
 *   }
 * }
 *
 * Errors:
 * - 400: Invalid query parameters
 * - 401: Not authenticated
 * - 404: TO or TO line not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { AvailableLPsQuerySchema } from '@/lib/validation/to-lp-validation'
import { getAvailableLPsForTOLine, TOLPErrorCode } from '@/lib/services/to-lp-service'
import { ZodError } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
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

    const { id: toId, lineId: toLineId } = await params

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      lot_number: searchParams.get('lot_number') || undefined,
      expiry_from: searchParams.get('expiry_from') || undefined,
      expiry_to: searchParams.get('expiry_to') || undefined,
      search: searchParams.get('search') || undefined,
    }

    // Validate query parameters
    const filters = AvailableLPsQuerySchema.parse(queryParams)

    // Call service method
    const result = await getAvailableLPsForTOLine(toId, toLineId, filters)

    if (!result.success) {
      // Determine appropriate status code
      let status = 400

      switch (result.code) {
        case TOLPErrorCode.TO_NOT_FOUND:
        case TOLPErrorCode.TO_LINE_NOT_FOUND:
          status = 404
          break
        default:
          status = 500
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.code,
            message: result.error,
          },
        },
        { status }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          lps: result.data?.lps,
          total_count: result.data?.total_count,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/planning/transfer-orders/:id/lines/:lineId/available-lps:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.errors[0]?.message || 'Invalid query parameters',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
