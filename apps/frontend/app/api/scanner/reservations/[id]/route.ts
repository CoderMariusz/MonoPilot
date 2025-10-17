import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = parseInt(params.id);

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: 'Invalid reservation ID' },
        { status: 400 }
      );
    }

    // Get reservation details
    const { data: reservation, error: resError } = await supabase
      .from('lp_reservations')
      .select(`
        id,
        lp_id,
        status,
        license_plate:license_plates(lp_number)
      `)
      .eq('id', reservationId)
      .single();

    if (resError || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (reservation.status !== 'active') {
      return NextResponse.json(
        { error: 'Can only cancel active reservations' },
        { status: 400 }
      );
    }

    // Cancel reservation
    const { error: cancelError } = await supabase
      .from('lp_reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId);

    if (cancelError) {
      return NextResponse.json(
        { error: 'Failed to cancel reservation', details: cancelError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reservation_id: reservationId,
      lp_number: reservation.license_plate?.lp_number,
      message: 'Reservation cancelled successfully'
    });

  } catch (error) {
    console.error('Error in cancel reservation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}