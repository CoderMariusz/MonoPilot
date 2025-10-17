import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wo_id, line_id } = body;

    if (!wo_id) {
      return NextResponse.json(
        { error: 'Work order ID is required' },
        { status: 400 }
      );
    }

    // Verify work order exists and is for FG (Finished Goods)
    const { data: workOrder, error: woError } = await supabase
      .from('work_orders')
      .select(`
        id,
        wo_number,
        kpi_scope,
        product:products(part_number, description, uom)
      `)
      .eq('id', wo_id)
      .single();

    if (woError || !workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    if (workOrder.kpi_scope !== 'FG') {
      return NextResponse.json(
        { error: 'Pallet can only be created for Finished Goods work orders' },
        { status: 400 }
      );
    }

    // Generate pallet number
    const { data: palletNumber, error: numberError } = await supabase
      .rpc('generate_pallet_number');

    if (numberError) {
      return NextResponse.json(
        { error: 'Failed to generate pallet number' },
        { status: 500 }
      );
    }

    // Create pallet
    const { data: pallet, error: palletError } = await supabase
      .from('pallets')
      .insert({
        pallet_number: palletNumber,
        wo_id: wo_id,
        line_id: line_id || null,
        status: 'building',
        created_by: '00000000-0000-0000-0000-000000000000' // TODO: Get from auth context
      })
      .select(`
        id,
        pallet_number,
        wo_id,
        line_id,
        status,
        created_at
      `)
      .single();

    if (palletError) {
      return NextResponse.json(
        { error: 'Failed to create pallet', details: palletError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pallet: {
        id: pallet.id,
        pallet_number: pallet.pallet_number,
        wo_id: pallet.wo_id,
        line_id: pallet.line_id,
        status: pallet.status,
        created_at: pallet.created_at
      }
    });

  } catch (error) {
    console.error('Error in create pallet API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const woId = searchParams.get('wo_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('pallets')
      .select(`
        id,
        pallet_number,
        wo_id,
        line_id,
        status,
        created_at,
        work_order:work_orders(wo_number, product:products(part_number, description))
      `)
      .order('created_at', { ascending: false });

    if (woId) {
      query = query.eq('wo_id', woId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: pallets, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch pallets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pallets: pallets || []
    });

  } catch (error) {
    console.error('Error in get pallets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
