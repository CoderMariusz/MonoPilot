import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ woId: string; seq: string }> }
) {
  const { woId: woIdStr, seq: seqStr } = await params;
  try {
    const woId = parseInt(woIdStr);
    const seq = parseInt(seqStr);
    const { user_id } = await request.json();

    if (!woId || isNaN(woId) || !seq || isNaN(seq)) {
      return NextResponse.json(
        { error: 'Invalid work order ID or operation sequence' },
        { status: 400 }
      );
    }

    // Get work order and operation details
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select(`
        *,
        wo_operations:wo_operations(*)
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
        { error: 'Cannot complete operation that is not current' },
        { status: 400 }
      );
    }

    // Check if operation has weights recorded
    if (!operation.actual_input_weight || !operation.actual_output_weight) {
      return NextResponse.json(
        { error: 'Cannot complete operation without recorded weights' },
        { status: 400 }
      );
    }

    // Mark operation as completed
    const { data: updatedOp, error: updateError } = await supabase
      .from('wo_operations')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        operator_id: user_id
      })
      .eq('wo_id', woId)
      .eq('sequence', seq)
      .select()
      .single();

    if (updateError) throw updateError;

    // Check if there's a next operation
    const nextSeq = seq + 1;
    const hasNextOperation = woData.wo_operations?.some((op: any) => op.sequence === nextSeq);
    
    let nextOperationSeq = null;
    let workOrderStatus = woData.status;

    if (hasNextOperation) {
      // Move to next operation
      await supabase
        .from('work_orders')
        .update({ current_operation_seq: nextSeq })
        .eq('id', woId);
      
      nextOperationSeq = nextSeq;
    } else {
      // All operations completed
      await supabase
        .from('work_orders')
        .update({ 
          current_operation_seq: null,
          status: 'completed',
          actual_end: new Date().toISOString()
        })
        .eq('id', woId);
      
      workOrderStatus = 'completed';
    }

    // Auto-stage output for next operation (handover)
    if (hasNextOperation) {
      // This would involve creating output LPs and staging them for the next operation
      // For now, we'll just log this requirement
      console.log('Auto-staging output for next operation:', nextSeq);
    }

    // Log the operation completion
    await supabase
      .from('work_orders_audit')
      .insert({
        wo_id: woId,
        action: 'OPERATION_COMPLETED',
        details: {
          operation_seq: seq,
          operation_name: operation.operation_name,
          input_weight: operation.actual_input_weight,
          output_weight: operation.actual_output_weight,
          yield_percent: operation.actual_input_weight > 0 
            ? (operation.actual_output_weight / operation.actual_input_weight) * 100 
            : 0,
          next_operation_seq: nextOperationSeq,
          work_order_status: workOrderStatus
        },
        created_by: user_id
      });

    return NextResponse.json({
      success: true,
      message: 'Operation completed successfully',
      data: {
        wo_id: woId,
        operation_seq: seq,
        operation_name: operation.operation_name,
        completed_at: new Date().toISOString(),
        next_operation_seq: nextOperationSeq,
        work_order_status: workOrderStatus,
        handover_required: hasNextOperation
      }
    });

  } catch (error) {
    console.error('Error completing operation:', error);
    return NextResponse.json(
      { error: 'Failed to complete operation' },
      { status: 500 }
    );
  }
}