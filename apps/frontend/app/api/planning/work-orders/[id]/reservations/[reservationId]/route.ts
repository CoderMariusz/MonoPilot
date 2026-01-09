/**
 * API Route: Delete WO Reservation (Story 03.11b)
 * Purpose: DELETE endpoint for releasing (un-reserving) a specific LP reservation
 *
 * Endpoint:
 * - DELETE /api/planning/work-orders/:id/reservations/:reservationId
 *   Release (un-reserve) a specific LP reservation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WOReservationService } from '@/lib/services/wo-reservation-service'
import { getWOReservationStatusCode } from '@/lib/utils/wo-reservation-errors'

interface RouteParams {
  params: Promise<{
    id: string
    reservationId: string
  }>
}

/**
 * DELETE /api/planning/work-orders/:id/reservations/:reservationId
 * Release (un-reserve) a specific LP reservation
 *
 * Response format:
 * {
 *   success: boolean,
 *   released_qty: number,
 *   message: string
 * }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: woId, reservationId } = await params

    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Release the reservation
    const result = await WOReservationService.releaseReservation(reservationId, user.id)

    if (!result.success) {
      const statusCode = getWOReservationStatusCode(result.code)
      return NextResponse.json(
        { success: false, error: { code: result.code, message: result.error } },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        released_qty: result.data.released_qty,
        message: result.data.message,
      },
      message: result.data.message,
    })
  } catch (error) {
    console.error('Error in DELETE reservation:', error)
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
