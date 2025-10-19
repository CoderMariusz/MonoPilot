import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client-browser';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ woId: string }> }
) {
  const { woId: woIdStr } = await params;
  try {
    const woId = parseInt(woIdStr);
    const { 
      action, // 'stage' or 'output'
      lp_id, // for staging
      qty, // for staging
      boxes, // for output
      box_weight_kg, // for output
      pallet_id, // for output
      user_id 
    } = await request.json();

    if (!woId || isNaN(woId)) {
      return NextResponse.json(
        { error: 'Invalid work order ID' },
        { status: 400 }
      );
    }

    // Get work order details
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select('*')
      .eq('id', woId)
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
        { error: 'Pack terminal can only be used for Finished Goods work orders' },
        { status: 400 }
      );
    }

    if (action === 'stage') {
      // Stage meat LPs for FG work orders
      if (!lp_id || !qty || qty <= 0) {
        return NextResponse.json(
          { error: 'LP ID and positive quantity are required for staging' },
          { status: 400 }
        );
      }

      // Get LP details
      const { data: lpData, error: lpError } = await supabase
        .from('license_plates')
        .select(`
          *,
          product:products(description, part_number, type)
        `)
        .eq('id', lp_id)
        .single();

      if (lpError || !lpData) {
        return NextResponse.json(
          { error: 'License plate not found' },
          { status: 404 }
        );
      }

      // Check QA status
      if (lpData.qa_status !== 'Passed') {
        return NextResponse.json(
          { 
            error: 'QA gate blocked: License plate must have Passed status',
            qa_status: lpData.qa_status,
            lp_number: lpData.lp_number
          },
          { status: 400 }
        );
      }

      // Create reservation for staging
      const { data: reservation, error: createError } = await supabase
        .from('lp_reservations')
        .insert({
          lp_id,
          wo_id: woId,
          qty,
          status: 'active',
          created_by: user_id
        })
        .select()
        .single();

      if (createError) throw createError;

      return NextResponse.json({
        success: true,
        message: 'LP staged for packing',
        data: {
          wo_id: woId,
          lp_id,
          lp_number: lpData.lp_number,
          product_name: lpData.product?.description,
          qty,
          reservation_id: reservation.id
        }
      });

    } else if (action === 'output') {
      // Record boxes done + box_weight_kg
      if (!boxes || boxes <= 0 || !box_weight_kg || box_weight_kg <= 0) {
        return NextResponse.json(
          { error: 'Boxes and box weight must be positive numbers' },
          { status: 400 }
        );
      }

      // Update work order with actual boxes
      const { data: updatedWO, error: updateError } = await supabase
        .from('work_orders')
        .update({
          actual_boxes: boxes,
          box_weight_kg: box_weight_kg,
          actual_output_qty: boxes * box_weight_kg
        })
        .eq('id', woId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create production output record
      const { data: productionOutput, error: outputError } = await supabase
        .from('production_outputs')
        .insert({
          wo_id: woId,
          product_id: woData.product_id,
          quantity: boxes * box_weight_kg,
          uom: woData.uom,
          boxes: boxes,
          created_by: user_id
        })
        .select()
        .single();

      if (outputError) throw outputError;

      // Create box LPs if needed
      const boxLPs = [];
      for (let i = 0; i < boxes; i++) {
        const { data: boxLP, error: boxError } = await supabase
          .from('license_plates')
          .insert({
            product_id: woData.product_id,
            location_id: woData.machine_id, // Assuming machine_id is the packing location
            quantity: box_weight_kg,
            qa_status: 'Passed',
            stage_suffix: null,
            origin_type: 'WO_OUTPUT',
            origin_ref: { wo_id: woId, production_output_id: productionOutput.id },
            created_by: user_id
          })
          .select()
          .single();

        if (boxError) throw boxError;
        boxLPs.push(boxLP);

        // Record composition if pallet_id is provided
        if (pallet_id) {
          // This would link the box LP to the pallet
          // Implementation depends on pallet structure
          console.log('Linking box LP to pallet:', boxLP.id, pallet_id);
        }
      }

      // Log the packing output
      await supabase
        .from('work_orders_audit')
        .insert({
          wo_id: woId,
          action: 'PACK_OUTPUT_RECORDED',
          details: {
            boxes,
            box_weight_kg,
            total_weight_kg: boxes * box_weight_kg,
            production_output_id: productionOutput.id,
            box_lp_ids: boxLPs.map(lp => lp.id),
            pallet_id
          },
          created_by: user_id
        });

      return NextResponse.json({
        success: true,
        message: 'Packing output recorded successfully',
        data: {
          wo_id: woId,
          boxes,
          box_weight_kg,
          total_weight_kg: boxes * box_weight_kg,
          production_output_id: productionOutput.id,
          box_lp_ids: boxLPs.map(lp => lp.id),
          pallet_id
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "stage" or "output"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in pack terminal:', error);
    return NextResponse.json(
      { error: 'Failed to process pack terminal request' },
      { status: 500 }
    );
  }
}
