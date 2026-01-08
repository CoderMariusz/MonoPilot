/**
 * API Route: Reserve All WO Materials (Story 03.11b)
 * Purpose: POST endpoint for auto-reserving all WO materials
 *
 * Endpoint:
 * - POST /api/planning/work-orders/:id/reserve-all
 *   Trigger auto-reservation for all materials using FIFO/FEFO
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WOReservationService, WOReservationErrorCode } from '@/lib/services/wo-reservation-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * Map error codes to HTTP status codes
 */
function getStatusCode(code: string): number {
  switch (code) {
    case WOReservationErrorCode.WO_NOT_FOUND:
      return 404
    case WOReservationErrorCode.INVALID_WO_STATUS:
      return 409
    default:
      return 500
  }
}

/**
 * POST /api/planning/work-orders/:id/reserve-all
 * Trigger auto-reservation for all materials
 *
 * Response format:
 * {
 *   success: boolean,
 *   materials_processed: number,
 *   fully_reserved: number,
 *   partially_reserved: number,
 *   shortages: Array<{
 *     material_name: string,
 *     required_qty: number,
 *     reserved_qty: number,
 *     shortage: number
 *   }>
 * }
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: woId } = await params

    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Auto-reserve all materials
    const result = await WOReservationService.autoReserveWOMaterials(woId)

    if (!result.success) {
      const statusCode = getStatusCode(result.code || 'DATABASE_ERROR')
      return NextResponse.json(
        { success: false, error: { code: result.code, message: result.error } },
        { status: statusCode }
      )
    }

    // Build message
    let message = 'Materials reserved successfully'
    if (result.data.materials_processed === 0) {
      message = 'No materials to reserve'
    } else if (result.data.shortages.length > 0) {
      message = `${result.data.fully_reserved} materials fully reserved, ${result.data.partially_reserved} with shortages`
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message,
    })
  } catch (error) {
    console.error('Error in POST reserve-all:', error)
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
