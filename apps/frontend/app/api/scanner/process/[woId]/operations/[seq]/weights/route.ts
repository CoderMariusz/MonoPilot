import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { woId: string; seq: string } }
) {
  try {
    const woId = parseInt(params.woId);
    const seq = parseInt(params.seq);
    const { 
      in_kg, 
      out_kg, 
      cooking_loss_weight, 
      trim_loss_weight, 
      marinade_gain_weight, 
      scrap_breakdown,
      user_id 
    } = await request.json();

    if (!woId || isNaN(woId) || !seq || isNaN(seq)) {
      return NextResponse.json(
        { error: 'Invalid work order ID or operation sequence' },
        { status: 400 }
      );
    }

    if (!in_kg || !out_kg || in_kg <= 0 || out_kg <= 0) {
      return NextResponse.json(
        { error: 'Input and output weights must be positive numbers' },
        { status: 400 }
      );
    }

    // Get work order and operation details
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select(`
        *,
        wo_operations:wo_operations(*),
        wo_materials:wo_materials(*)
      `)
      .eq('id', woId)
      .single();

    if (woError || !woData) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Check if operation exists and is current
    const operation = woData.wo_operations?.find((op: any) => op.sequence === seq);
    if (!operation) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    if (woData.current_operation_seq !== seq) {
      return NextResponse.json(
        { error: 'Cannot record weights for operation that is not current' },
        { status: 400 }
      );
    }

    // Check if operation already has weights
    if (operation.actual_input_weight && operation.actual_output_weight) {
      return NextResponse.json(
        { error: 'Operation already has weights recorded' },
        { status: 400 }
      );
    }

    // Validate 1:1 components (hard rule enforcement)
    const oneToOneMaterials = woData.wo_materials?.filter((mat: any) => 
      mat.one_to_one && mat.sequence === seq
    ) || [];

    if (oneToOneMaterials.length > 0) {
      // For 1:1 components, validate that exactly one input LP produces one output LP
      // This would require checking staged LPs and their consumption
      // For now, we'll validate the weight relationship
      const expectedInputWeight = oneToOneMaterials.reduce((sum, mat) => 
        sum + parseFloat(mat.quantity), 0
      );
      
      if (Math.abs(in_kg - expectedInputWeight) > 0.01) {
          return NextResponse.json(
            { 
            error: '1:1 component validation failed: input weight does not match expected quantity',
            expected_weight: expectedInputWeight,
            actual_weight: in_kg,
            one_to_one_materials: oneToOneMaterials.map(mat => ({
              material_id: mat.material_id,
              quantity: mat.quantity
            }))
            },
            { status: 400 }
          );
      }
    }

    // Update operation with weights
    const { data: updatedOp, error: updateError } = await supabase
        .from('wo_operations')
        .update({
          actual_input_weight: in_kg,
          actual_output_weight: out_kg,
        cooking_loss_weight: cooking_loss_weight || 0,
        trim_loss_weight: trim_loss_weight || 0,
        marinade_gain_weight: marinade_gain_weight || 0,
        scrap_breakdown: scrap_breakdown || null,
        finished_at: new Date().toISOString(),
        operator_id: user_id
      })
      .eq('wo_id', woId)
      .eq('sequence', seq)
      .select()
      .single();

    if (updateError) throw updateError;

    // Calculate yield for this operation
    const yield_percent = in_kg > 0 ? (out_kg / in_kg) * 100 : 0;

    // Create stock moves for losses and outputs
    const stockMoves = [];

    // ADJUST move for losses
    const totalLoss = (cooking_loss_weight || 0) + (trim_loss_weight || 0) - (marinade_gain_weight || 0);
    if (totalLoss > 0) {
      const { data: adjustMove, error: adjustError } = await supabase
        .from('stock_moves')
        .insert({
          move_number: `ADJ-${Date.now()}`,
          lp_id: null, // Would need to determine which LP to adjust
          move_type: 'ADJUST',
          status: 'completed',
          quantity: totalLoss,
          move_date: new Date().toISOString(),
          wo_id: woId,
          meta: {
            operation_id: updatedOp.id,
            operation_seq: seq,
            loss_type: 'operation_loss',
            cooking_loss: cooking_loss_weight || 0,
            trim_loss: trim_loss_weight || 0,
            marinade_gain: marinade_gain_weight || 0
          },
          source: 'scanner',
          created_by: user_id
        })
        .select()
        .single();

      if (adjustError) throw adjustError;
      stockMoves.push(adjustMove);
    }

    // WO_OUTPUT move for operation output
    const { data: outputMove, error: outputError } = await supabase
      .from('stock_moves')
      .insert({
        move_number: `WO-OUT-${Date.now()}`,
        lp_id: null, // Would need to create or link to output LP
        move_type: 'WO_OUTPUT',
        status: 'completed',
        quantity: out_kg,
        move_date: new Date().toISOString(),
        wo_id: woId,
        meta: {
          operation_id: updatedOp.id,
          operation_seq: seq,
          yield_percent: yield_percent
        },
        source: 'scanner',
        created_by: user_id
      })
      .select()
      .single();

    if (outputError) throw outputError;
    stockMoves.push(outputMove);

    // Update work order current operation sequence
    const nextSeq = seq + 1;
    const hasNextOperation = woData.wo_operations?.some((op: any) => op.sequence === nextSeq);
    
    if (hasNextOperation) {
      await supabase
        .from('work_orders')
        .update({ current_operation_seq: nextSeq })
        .eq('id', woId);
    } else {
      // All operations completed
      await supabase
        .from('work_orders')
        .update({ 
          current_operation_seq: null,
          status: 'completed'
        })
        .eq('id', woId);
    }

    // Log the operation completion
      await supabase
      .from('work_orders_audit')
      .insert({
        wo_id,
        action: 'OPERATION_WEIGHTS_RECORDED_SCANNER',
        details: {
          operation_seq: seq,
          in_kg,
          out_kg,
          yield_percent,
          losses: {
            cooking: cooking_loss_weight || 0,
            trim: trim_loss_weight || 0,
            marinade_gain: marinade_gain_weight || 0
          },
          stock_moves: stockMoves.map(sm => sm.id),
          one_to_one_validation: oneToOneMaterials.length > 0
        },
        created_by: user_id
      });

    return NextResponse.json({
      success: true,
      message: 'Operation weights recorded successfully',
      data: {
        operation: updatedOp,
        yield_percent,
        stock_moves: stockMoves,
        next_operation_seq: hasNextOperation ? nextSeq : null,
        work_order_status: hasNextOperation ? 'in_progress' : 'completed'
      }
    });

  } catch (error) {
    console.error('Error recording operation weights:', error);
    return NextResponse.json(
      { error: 'Failed to record operation weights' },
      { status: 500 }
    );
  }
}