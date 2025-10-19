import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client-browser';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ woId: string; seq: string }> }
) {
  const { woId: woIdStr, seq: seqStr } = await params;
  try {
    const woId = parseInt(woIdStr);
    const seq = parseInt(seqStr);
    const { lp_id, qty, user_id } = await request.json();

    if (!woId || isNaN(woId) || !seq || isNaN(seq)) {
      return NextResponse.json(
        { error: 'Invalid work order ID or operation sequence' },
        { status: 400 }
      );
    }

    if (!lp_id || !qty || qty <= 0) {
      return NextResponse.json(
        { error: 'LP ID and positive quantity are required' },
        { status: 400 }
      );
    }

    // Get work order details
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select(`
        *,
        wo_materials:wo_materials(
          sequence,
          material_id,
          quantity,
          one_to_one
        )
      `)
      .eq('id', woId)
      .single();

    if (woError || !woData) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Check if this is the current operation
    if (woData.current_operation_seq !== seq) {
      return NextResponse.json(
        { error: 'Cannot stage for operation that is not current' },
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

    // Check available quantity
    const { data: reservations, error: resError } = await supabase
      .from('lp_reservations')
      .select('qty')
      .eq('lp_id', lp_id)
      .eq('status', 'active');

    if (resError) throw resError;

    const reserved_qty = reservations?.reduce((sum, r) => sum + parseFloat(r.qty), 0) || 0;
    const available_qty = parseFloat(lpData.quantity) - reserved_qty;

    if (qty > available_qty) {
      return NextResponse.json(
        { 
          error: 'Insufficient available quantity',
          requested_qty: qty,
          available_qty,
          total_qty: parseFloat(lpData.quantity),
          reserved_qty
        },
        { status: 400 }
      );
    }

    // Cross-WO PR validation for exact matching
    const requiredMaterials = woData.wo_materials?.filter((mat: any) => 
      mat.sequence === seq
    ) || [];

    const expectedMaterial = requiredMaterials.find((mat: any) => 
      mat.material_id === lpData.product_id
    );

    if (!expectedMaterial) {
      return NextResponse.json(
        { 
          error: 'Cross-WO PR validation failed: LP product does not match expected material',
          lp_product_id: lpData.product_id,
          lp_product_name: lpData.product?.description,
          expected_materials: requiredMaterials.map((mat: any) => ({
            material_id: mat.material_id,
            quantity: mat.quantity,
            one_to_one: mat.one_to_one
          }))
        },
        { status: 400 }
      );
    }

    // Check stage suffix for cross-WO PR
    if (lpData.stage_suffix) {
      // This would need to be enhanced to validate stage suffix matches expected stage
      // For now, we'll just log this requirement
      console.log('Stage suffix validation needed:', lpData.stage_suffix);
    }

    // Create reservation
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

    // Log the staging
    await supabase
      .from('work_orders_audit')
      .insert({
        wo_id: woId,
        action: 'LP_STAGED',
        details: {
          operation_seq: seq,
          lp_id,
          lp_number: lpData.lp_number,
          qty,
          reservation_id: reservation.id,
          product_name: lpData.product?.description,
          stage_suffix: lpData.stage_suffix
        },
        created_by: user_id
      });

    return NextResponse.json({
      success: true,
      message: 'LP staged successfully',
      data: {
        wo_id: woId,
        operation_seq: seq,
        lp_id,
        lp_number: lpData.lp_number,
        product_name: lpData.product?.description,
        qty,
        reservation_id: reservation.id,
        available_qty: available_qty - qty
      }
    });

  } catch (error) {
    console.error('Error staging LP:', error);
    return NextResponse.json(
      { error: 'Failed to stage LP' },
      { status: 500 }
    );
  }
}