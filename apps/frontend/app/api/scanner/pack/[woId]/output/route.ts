import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ woId: string }> }
) {
  const { woId: woIdStr } = await params;
  try {
    const woId = parseInt(woIdStr);
    const body = await request.json();
    const { 
      boxes, 
      box_weight_kg, 
      pallet_id, 
      input_lps 
    } = body;

    if (isNaN(woId)) {
      return NextResponse.json(
        { error: 'Invalid work order ID' },
        { status: 400 }
      );
    }

    if (!boxes || !box_weight_kg || boxes <= 0 || box_weight_kg <= 0) {
      return NextResponse.json(
        { error: 'Boxes count and box weight must be positive values' },
        { status: 400 }
      );
    }

    // Get work order details
    const { data: workOrder, error: woError } = await supabase
      .from('work_orders')
      .select(`
        id,
        wo_number,
        kpi_scope,
        product_id,
        product:products(part_number, description, uom)
      `)
      .eq('id', woId)
      .single();

    if (woError || !workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    if (workOrder.kpi_scope !== 'FG') {
      return NextResponse.json(
        { error: 'Pack output can only be recorded for Finished Goods work orders' },
        { status: 400 }
      );
    }

    // Calculate total weight
    const totalWeight = boxes * box_weight_kg;

    // Verify pallet exists if provided
    if (pallet_id) {
      const { data: pallet, error: palletError } = await supabase
        .from('pallets')
        .select('id, status')
        .eq('id', pallet_id)
        .single();

      if (palletError || !pallet) {
        return NextResponse.json(
          { error: 'Pallet not found' },
          { status: 404 }
        );
      }

      if (pallet.status !== 'building') {
        return NextResponse.json(
          { error: 'Can only add output to pallets in building status' },
          { status: 400 }
        );
      }
    }

    // Start transaction-like operations
    const operations = [];

    // 1. Create box LP for the output
    const boxLPNumber = `FG-${workOrder.wo_number}-${Date.now()}`;
    
    operations.push(
      supabase
        .from('license_plates')
        .insert({
          lp_number: boxLPNumber,
          product_id: workOrder.product_id,
          location_id: 1, // TODO: Get default location from settings
          quantity: totalWeight,
          qa_status: 'Passed', // Assume FG output passes QA
          origin_type: 'WO_OUTPUT',
          origin_ref: {
            wo_id: woId,
            pack_output: true,
            boxes: boxes,
            box_weight_kg: box_weight_kg
          }
        })
        .select('id')
        .single()
    );

    // Execute box LP creation
    const results = await Promise.allSettled(operations);
    const boxLPResult = results[0];

    if (boxLPResult.status === 'rejected' || !boxLPResult.value.data) {
      return NextResponse.json(
        { error: 'Failed to create box LP' },
        { status: 500 }
      );
    }

    const boxLPId = boxLPResult.value.data.id;

    // 2. Record production output
    await supabase
      .from('production_outputs')
      .insert({
        wo_id: woId,
        product_id: workOrder.product_id,
        quantity: totalWeight,
        uom: workOrder.product?.[0]?.uom || 'KG',
        lp_id: boxLPId,
        boxes: boxes,
        source: 'scanner'
      });

    // 3. Record LP compositions if input LPs provided
    if (input_lps && Array.isArray(input_lps) && input_lps.length > 0) {
      // Verify input LPs exist
      const { data: inputLPs, error: inputError } = await supabase
        .from('license_plates')
        .select('id, lp_number, quantity, product_id')
        .in('id', input_lps);

      if (inputError) {
        console.error('Failed to fetch input LPs:', inputError);
      } else if (inputLPs) {
        // Record compositions
        const compositions = inputLPs.map(inputLP => ({
          output_lp_id: boxLPId,
          input_lp_id: inputLP.id,
          quantity_consumed: inputLP.quantity, // Assume full consumption for now
          uom: workOrder.product?.[0]?.uom || 'KG' // TODO: Get actual UOM from input LP product
        }));

        await supabase
          .from('lp_compositions')
          .insert(compositions);
      }
    }

    // 4. Add box LP to pallet if pallet_id provided
    if (pallet_id) {
      // Get next sequence number for pallet
      const { data: lastItem } = await supabase
        .from('pallet_items')
        .select('sequence')
        .eq('pallet_id', pallet_id)
        .order('sequence', { ascending: false })
        .limit(1)
        .single();

      const nextSequence = (lastItem?.sequence || 0) + 1;

      await supabase
        .from('pallet_items')
        .insert({
          pallet_id: pallet_id,
          box_lp_id: boxLPId,
          sequence: nextSequence,
          added_by: '00000000-0000-0000-0000-000000000000' // TODO: Get from auth context
        });
    }

    // 5. Create stock move for the output
    await supabase
      .from('stock_moves')
      .insert({
        move_number: `SM-PACK-OUTPUT-${Date.now()}`,
        lp_id: boxLPId,
        from_location_id: null,
        to_location_id: 1, // TODO: Get default location from settings
        quantity: totalWeight,
        reason: `Pack Output - ${boxes} boxes`,
        status: 'completed',
        move_date: new Date().toISOString(),
        wo_number: workOrder.wo_number,
        move_type: 'WO_OUTPUT',
        source: 'scanner',
        meta: {
          wo_id: woId,
          pack_output: true,
          boxes: boxes,
          box_weight_kg: box_weight_kg,
          pallet_id: pallet_id
        }
      });

    return NextResponse.json({
      success: true,
      output: {
        box_lp: {
          id: boxLPId,
          lp_number: boxLPNumber,
          quantity: totalWeight,
          boxes: boxes,
          box_weight_kg: box_weight_kg
        },
        pallet_id: pallet_id,
        composition_recorded: input_lps ? input_lps.length : 0
      }
    });

  } catch (error) {
    console.error('Error in pack output API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
