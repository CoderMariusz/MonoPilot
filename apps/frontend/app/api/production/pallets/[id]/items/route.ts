import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client-browser';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const palletId = parseInt(id);
    const { box_lp_ids, user_id } = await request.json();

    if (!palletId || isNaN(palletId)) {
      return NextResponse.json(
        { error: 'Invalid pallet ID' },
        { status: 400 }
      );
    }

    if (!box_lp_ids || !Array.isArray(box_lp_ids) || box_lp_ids.length === 0) {
      return NextResponse.json(
        { error: 'Box LP IDs array is required' },
        { status: 400 }
      );
    }

    // Check if pallet exists
    const { data: palletData, error: palletError } = await supabase
      .from('pallets')
      .select('*')
      .eq('id', palletId)
      .single();

    if (palletError || !palletData) {
      return NextResponse.json(
        { error: 'Pallet not found' },
        { status: 404 }
      );
    }

    // Validate box LPs exist and are available
    const { data: boxLPs, error: boxError } = await supabase
      .from('license_plates')
      .select('id, lp_number, qa_status, location_id')
      .in('id', box_lp_ids);

    if (boxError) throw boxError;

    if (boxLPs.length !== box_lp_ids.length) {
      return NextResponse.json(
        { error: 'Some box LPs not found' },
        { status: 400 }
      );
    }

    // Check QA status of all box LPs
    const failedQA = boxLPs.filter(lp => lp.qa_status !== 'Passed');
    if (failedQA.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some box LPs have failed QA status',
          failed_lps: failedQA.map(lp => ({
            lp_id: lp.id,
            lp_number: lp.lp_number,
            qa_status: lp.qa_status
          }))
        },
        { status: 400 }
      );
    }

    // Create pallet items
    const palletItems = box_lp_ids.map((box_lp_id, index) => ({
      pallet_id: palletId,
      box_lp_id,
      sequence: index + 1,
      created_by: user_id
    }));

    const { data: createdItems, error: createError } = await supabase
      .from('pallet_items')
      .insert(palletItems)
      .select(`
        *,
        box_lp:license_plates!box_lp_id(lp_number, product_id, products!inner(description))
      `);

    if (createError) throw createError;

    // Update pallet updated_at
    await supabase
      .from('pallets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', palletId);

    // Log the pallet items addition
    await supabase
      .from('work_orders_audit')
      .insert({
        wo_id: palletData.wo_id,
        action: 'PALLET_ITEMS_ADDED',
        details: {
          pallet_id: palletId,
          pallet_code: palletData.code,
          items_added: createdItems.length,
          box_lp_ids,
          created_by: user_id
        },
        created_by: user_id
      });

    return NextResponse.json({
      success: true,
      message: 'Pallet items added successfully',
      data: {
        pallet_id: palletId,
        pallet_code: palletData.code,
        items_added: createdItems.length,
        items: createdItems
      }
    });

  } catch (error) {
    console.error('Error adding pallet items:', error);
    return NextResponse.json(
      { error: 'Failed to add pallet items' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const palletId = parseInt(id);

    if (!palletId || isNaN(palletId)) {
      return NextResponse.json(
        { error: 'Invalid pallet ID' },
        { status: 400 }
      );
    }

    // Get pallet contents
    const { data: palletContents, error: contentsError } = await supabase
      .rpc('get_pallet_contents', { pallet_id_param: palletId });

    if (contentsError) throw contentsError;

    // Get pallet summary
    const { data: palletSummary, error: summaryError } = await supabase
      .rpc('get_pallet_summary', { pallet_id_param: palletId });

    if (summaryError) throw summaryError;

    return NextResponse.json({
      success: true,
      data: {
        contents: palletContents || [],
        summary: palletSummary?.[0] || null
      }
    });

  } catch (error) {
    console.error('Error fetching pallet contents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pallet contents' },
      { status: 500 }
    );
  }
}
