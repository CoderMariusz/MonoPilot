// API Route: Delete Material Reservation
// Story 4.7: Material Reservation (Desktop)
// DELETE /api/production/work-orders/:id/materials/reservations/:reservationId - Unreserve material

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { MaterialReservationService, ReservationErrorCodes } from '@/lib/services/material-reservation-service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reservationId: string }> }
) {
  try {
    const { id: woId, reservationId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: ReservationErrorCodes.UNAUTHORIZED, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabaseAdmin = createServerSupabaseAdmin()
    const service = new MaterialReservationService(supabaseAdmin)

    const { data, error } = await service.unreserveMaterial(
      {
        reservationId,
        woId,
        userId: session.user.id,
        orgId: currentUser.org_id,
      },
      currentUser.role
    )

    if (error) {
      const statusCode = getStatusCode(error.code)
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: statusCode }
      )
    }

    // Broadcast realtime event for material.unreserved
    try {
      await supabaseAdmin.channel(`wo:${woId}`).send({
        type: 'broadcast',
        event: 'material.unreserved',
        payload: {
          wo_id: woId,
          reservation_id: reservationId,
          unreserved: data,
        },
      })
    } catch (broadcastError) {
      console.error('Error broadcasting material.unreserved:', broadcastError)
    }

    return NextResponse.json({
      data,
      message: 'Reservation cancelled successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/production/work-orders/:id/materials/reservations/:reservationId:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getStatusCode(errorCode: string): number {
  switch (errorCode) {
    case ReservationErrorCodes.UNAUTHORIZED:
      return 401
    case ReservationErrorCodes.FORBIDDEN:
      return 403
    case ReservationErrorCodes.RESERVATION_NOT_FOUND:
      return 404
    default:
      return 400
  }
}
