import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const palletId = parseInt(params.id);

    if (isNaN(palletId)) {
      return NextResponse.json(
        { error: 'Invalid pallet ID' },
        { status: 400 }
      );
    }

    // Get pallet details
    const { data: pallet, error: palletError } = await supabase
      .from('pallets')
      .select(`
        id,
        pallet_number,
        wo_id,
        line_id,
        status,
        created_at,
        updated_at,
        work_order:work_orders(
          wo_number,
          product:products(part_number, description, uom)
        ),
        machine:machines(name, code)
      `)
      .eq('id', palletId)
      .single();

    if (palletError || !pallet) {
      return NextResponse.json(
        { error: 'Pallet not found' },
        { status: 404 }
      );
    }

    // Get pallet items (box LPs)
    const { data: palletItems, error: itemsError } = await supabase
      .from('pallet_items')
      .select(`
        id,
        sequence,
        added_at,
        box_lp:license_plates(
          id,
          lp_number,
          quantity,
          qa_status,
          product:products(part_number, description, uom)
        )
      `)
      .eq('pallet_id', palletId)
      .order('sequence');

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch pallet items' },
        { status: 500 }
      );
    }

    // Get pallet summary
    const { data: summary } = await supabase
      .rpc('get_pallet_summary', { pallet_id_param: palletId });

    return NextResponse.json({
      success: true,
      pallet: {
        ...pallet,
        items: palletItems || [],
        summary: summary?.[0] || null
      }
    });

  } catch (error) {
    console.error('Error in get pallet details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const palletId = parseInt(params.id);
    const body = await request.json();
    const { status } = body;

    if (isNaN(palletId)) {
      return NextResponse.json(
        { error: 'Invalid pallet ID' },
        { status: 400 }
      );
    }

    if (!status || !['building', 'complete', 'shipped', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

    // Update pallet status
    const { data: pallet, error: updateError } = await supabase
      .from('pallets')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', palletId)
      .select(`
        id,
        pallet_number,
        status,
        updated_at
      `)
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update pallet', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pallet: {
        id: pallet.id,
        pallet_number: pallet.pallet_number,
        status: pallet.status,
        updated_at: pallet.updated_at
      }
    });

  } catch (error) {
    console.error('Error in update pallet API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
