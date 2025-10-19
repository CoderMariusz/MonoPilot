import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client-browser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lp_id, wo_id, qty, operation_id, notes } = body;

    if (!lp_id || !wo_id || !qty || qty <= 0) {
      return NextResponse.json(
        { error: 'LP ID, work order ID, and positive quantity are required' },
        { status: 400 }
      );
    }

    // Get LP details
    const { data: licensePlate, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        qa_status,
        product:products(part_number, description, uom)
      `)
      .eq('id', lp_id)
      .single();

    if (lpError || !licensePlate) {
      return NextResponse.json(
        { error: 'License plate not found' },
        { status: 404 }
      );
    }

    // Check available quantity
    const { data: availableQty } = await supabase
      .rpc('get_available_quantity', { lp_id_param: lp_id });

    if (availableQty < qty) {
      return NextResponse.json(
        { error: `Insufficient available quantity. Available: ${availableQty}, Requested: ${qty}` },
        { status: 400 }
      );
    }

    // Create reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('lp_reservations')
      .insert({
        lp_id: lp_id,
        wo_id: wo_id,
        operation_id: operation_id || null,
        quantity_reserved: qty,
        status: 'active',
        reserved_by: '00000000-0000-0000-0000-000000000000', // TODO: Get from auth context
        notes: notes || null
      })
      .select(`
        id,
        lp_id,
        wo_id,
        operation_id,
        quantity_reserved,
        status,
        reserved_at,
        notes
      `)
      .single();

    if (reservationError) {
      return NextResponse.json(
        { error: 'Failed to create reservation', details: reservationError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        lp_id: reservation.lp_id,
        lp_number: licensePlate.lp_number,
        wo_id: reservation.wo_id,
        operation_id: reservation.operation_id,
        quantity_reserved: reservation.quantity_reserved,
        status: reservation.status,
        reserved_at: reservation.reserved_at,
        notes: reservation.notes
      },
      available_quantity: availableQty - qty
    });

  } catch (error) {
    console.error('Error in create reservation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lpId = searchParams.get('lp_id');
    const woId = searchParams.get('wo_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('lp_reservations')
      .select(`
        id,
        lp_id,
        wo_id,
        operation_id,
        quantity_reserved,
        status,
        reserved_at,
        consumed_at,
        notes,
        license_plate:license_plates(lp_number, product:products(part_number, description)),
        work_order:work_orders(wo_number),
        operation:wo_operations(seq_no)
      `)
      .order('reserved_at', { ascending: false });

    if (lpId) {
      query = query.eq('lp_id', lpId);
    }

    if (woId) {
      query = query.eq('wo_id', woId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reservations, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch reservations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reservations: reservations || []
    });

  } catch (error) {
    console.error('Error in get reservations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}