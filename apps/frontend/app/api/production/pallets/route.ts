import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { wo_id, line, user_id } = await request.json();

    if (!wo_id || !line) {
      return NextResponse.json(
        { error: 'Work order ID and line are required' },
        { status: 400 }
      );
    }

    // Check if work order exists
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select('wo_number, kpi_scope')
      .eq('id', wo_id)
      .single();

    if (woError || !woData) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Check if work order is for Finished Goods
    if (woData.kpi_scope !== 'FG') {
      return NextResponse.json(
        { error: 'Pallets can only be created for Finished Goods work orders' },
        { status: 400 }
      );
    }

    // Generate pallet code
    const { data: palletCode, error: codeError } = await supabase
      .rpc('generate_pallet_code');

    if (codeError) throw codeError;

    // Create pallet
    const { data: pallet, error: createError } = await supabase
      .from('pallets')
      .insert({
        wo_id,
        line,
        code: palletCode,
        created_by: user_id
      })
      .select()
      .single();

    if (createError) throw createError;

    // Log the pallet creation
    await supabase
      .from('work_orders_audit')
      .insert({
        wo_id,
        action: 'PALLET_CREATED',
        details: {
          pallet_id: pallet.id,
          pallet_code: pallet.code,
          line,
          created_by: user_id
        },
        created_by: user_id
      });

    return NextResponse.json({
      success: true,
      message: 'Pallet created successfully',
      data: {
        pallet,
        wo_number: woData.wo_number
      }
    });

  } catch (error) {
    console.error('Error creating pallet:', error);
    return NextResponse.json(
      { error: 'Failed to create pallet' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wo_id = searchParams.get('wo_id');
    const line = searchParams.get('line');

    let query = supabase
      .from('pallets')
      .select(`
        *,
        work_orders!inner(wo_number, kpi_scope),
        pallet_items(
          *,
          box_lp:license_plates!box_lp_id(lp_number, product_id, products!inner(description))
        )
      `);

    if (wo_id) query = query.eq('wo_id', wo_id);
    if (line) query = query.eq('line', line);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error fetching pallets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pallets' },
      { status: 500 }
    );
  }
}
