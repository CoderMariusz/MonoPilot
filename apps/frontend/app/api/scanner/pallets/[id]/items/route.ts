import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const palletId = parseInt(id);
    const body = await request.json();
    const { box_lp_ids } = body;

    if (isNaN(palletId)) {
      return NextResponse.json(
        { error: 'Invalid pallet ID' },
        { status: 400 }
      );
    }

    if (!box_lp_ids || !Array.isArray(box_lp_ids) || box_lp_ids.length === 0) {
      return NextResponse.json(
        { error: 'Array of box LP IDs is required' },
        { status: 400 }
      );
    }

    // Verify pallet exists and is in building status
    const { data: pallet, error: palletError } = await supabase
      .from('pallets')
      .select('id, status')
      .eq('id', palletId)
      .single();

    if (palletError || !pallet) {
      return NextResponse.json(
        { error: 'Pallet not found' },
        { status: 404 }
      );
    }

    if (pallet.status !== 'building') {
      return NextResponse.json(
        { error: 'Can only add items to pallets in building status' },
        { status: 400 }
      );
    }

    // Verify all box LPs exist and are available
    const { data: boxLPs, error: lpsError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        status,
        qa_status,
        product:products(part_number, description, uom)
      `)
      .in('id', box_lp_ids);

    if (lpsError) {
      return NextResponse.json(
        { error: 'Failed to fetch box LPs' },
        { status: 500 }
      );
    }

    if (!boxLPs || boxLPs.length !== box_lp_ids.length) {
      return NextResponse.json(
        { error: 'One or more box LPs not found' },
        { status: 404 }
      );
    }

    // Check if LPs are available and have passed QA
    const invalidLPs = boxLPs.filter(lp => 
      lp.status !== 'Available' || lp.qa_status !== 'Passed'
    );

    if (invalidLPs.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some box LPs are not available or have not passed QA',
          invalid_lps: invalidLPs.map(lp => ({
            lp_number: lp.lp_number,
            status: lp.status,
            qa_status: lp.qa_status
          }))
        },
        { status: 400 }
      );
    }

    // Check if any LP is already on another pallet
    const { data: existingItems, error: existingError } = await supabase
      .from('pallet_items')
      .select('box_lp_id, pallet:pallets(pallet_number)')
      .in('box_lp_id', box_lp_ids);

    if (existingError) {
      return NextResponse.json(
        { error: 'Failed to check existing pallet assignments' },
        { status: 500 }
      );
    }

    if (existingItems && existingItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some box LPs are already assigned to other pallets',
          conflicting_lps: existingItems.map(item => ({
            lp_id: item.box_lp_id,
            pallet_number: item.pallet?.[0]?.pallet_number
          }))
        },
        { status: 400 }
      );
    }

    // Get next sequence number
    const { data: lastItem } = await supabase
      .from('pallet_items')
      .select('sequence')
      .eq('pallet_id', palletId)
      .order('sequence', { ascending: false })
      .limit(1)
      .single();

    const nextSequence = (lastItem?.sequence || 0) + 1;

    // Insert pallet items
    const palletItems = box_lp_ids.map((lpId, index) => ({
      pallet_id: palletId,
      box_lp_id: lpId,
      sequence: nextSequence + index,
      added_by: '00000000-0000-0000-0000-000000000000' // TODO: Get from auth context
    }));

    const { data: insertedItems, error: insertError } = await supabase
      .from('pallet_items')
      .insert(palletItems)
      .select(`
        id,
        sequence,
        added_at,
        box_lp:license_plates(
          id,
          lp_number,
          quantity,
          product:products(part_number, description, uom)
        )
      `);

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to add items to pallet', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      items_added: insertedItems?.length || 0,
      items: insertedItems || []
    });

  } catch (error) {
    console.error('Error in add pallet items API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const palletId = parseInt(id);
    const body = await request.json();
    const { box_lp_ids } = body;

    if (isNaN(palletId)) {
      return NextResponse.json(
        { error: 'Invalid pallet ID' },
        { status: 400 }
      );
    }

    if (!box_lp_ids || !Array.isArray(box_lp_ids) || box_lp_ids.length === 0) {
      return NextResponse.json(
        { error: 'Array of box LP IDs is required' },
        { status: 400 }
      );
    }

    // Verify pallet exists and is in building status
    const { data: pallet, error: palletError } = await supabase
      .from('pallets')
      .select('id, status')
      .eq('id', palletId)
      .single();

    if (palletError || !pallet) {
      return NextResponse.json(
        { error: 'Pallet not found' },
        { status: 404 }
      );
    }

    if (pallet.status !== 'building') {
      return NextResponse.json(
        { error: 'Can only remove items from pallets in building status' },
        { status: 400 }
      );
    }

    // Remove items from pallet
    const { error: deleteError } = await supabase
      .from('pallet_items')
      .delete()
      .eq('pallet_id', palletId)
      .in('box_lp_id', box_lp_ids);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to remove items from pallet', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      items_removed: box_lp_ids.length
    });

  } catch (error) {
    console.error('Error in remove pallet items API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
