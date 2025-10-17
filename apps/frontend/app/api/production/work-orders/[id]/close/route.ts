import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string } } }
) {
  const { id } = await params;
  try {
    const woId = parseInt(id);
    const { user_id, reason } = await request.json();

    if (!woId || isNaN(woId)) {
      return NextResponse.json(
        { error: 'Invalid work order ID' },
        { status: 400 }
      );
    }

    // Get work order details
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select(`
        *,
        wo_operations:wo_operations(*),
        production_outputs:production_outputs(*)
      `)
      .eq('id', woId)
      .single();

    if (woError || !woData) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Check if already closed
    if (woData.closed_at) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Work order already closed',
          data: {
            wo_id: woId,
            closed_at: woData.closed_at,
            closed_by: woData.closed_by,
            closed_source: woData.closed_source
          }
        }
      );
    }

    // Validate all operations are completed
    const incompleteOps = woData.wo_operations?.filter((op: any) => 
      !op.actual_input_weight || !op.actual_output_weight
    ) || [];

    if (incompleteOps.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot close work order: incomplete operations',
          incomplete_operations: incompleteOps.map((op: any) => ({
            seq: op.sequence,
            name: op.operation_name
          }))
        },
        { status: 400 }
      );
    }

    // Calculate final yields based on KPI scope
    let finalYields: any = {};
    
    if (woData.kpi_scope === 'PR') {
      // Calculate PR yield
      const totalInput = woData.wo_operations?.reduce((sum: number, op: any) => 
        sum + (parseFloat(op.actual_input_weight) || 0), 0) || 0;
      const totalOutput = woData.wo_operations?.reduce((sum: number, op: any) => 
        sum + (parseFloat(op.actual_output_weight) || 0), 0) || 0;
      
      finalYields = {
        pr_yield_percent: totalInput > 0 ? (totalOutput / totalInput) * 100 : 0,
        total_input_kg: totalInput,
        total_output_kg: totalOutput
      };
    } else if (woData.kpi_scope === 'FG') {
      // Calculate FG yield
      const totalBoxes = woData.actual_boxes || 0;
      const boxWeight = woData.box_weight_kg || 0;
      const totalFGWeight = totalBoxes * boxWeight;
      const totalMeatInput = woData.actual_output_qty || 0;
      
      finalYields = {
        fg_yield_percent: totalMeatInput > 0 ? (totalFGWeight / totalMeatInput) * 100 : 0,
        total_boxes: totalBoxes,
        total_fg_weight_kg: totalFGWeight,
        total_meat_input_kg: totalMeatInput
      };
    }

    // Update work order with closure details
    const { data: updatedWO, error: updateError } = await supabase
      .from('work_orders')
      .update({
        status: 'completed',
        closed_at: new Date().toISOString(),
        closed_by: user_id,
        closed_source: 'portal',
        actual_end: new Date().toISOString(),
        actual_output_qty: woData.wo_operations?.reduce((sum: number, op: any) => 
          sum + (parseFloat(op.actual_output_weight) || 0), 0) || 0
      })
      .eq('id', woId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the closure in audit trail
    await supabase
      .from('work_orders_audit')
      .insert({
        wo_id: woId,
        action: 'WO_CLOSED',
        details: {
          closed_by: user_id,
          closed_source: 'portal',
          reason: reason,
          final_yields: finalYields,
          operations_completed: woData.wo_operations?.length || 0
        },
        created_by: user_id
      });

    return NextResponse.json({
      success: true,
      message: 'Work order closed successfully',
      data: {
        wo_id: woId,
        wo_number: updatedWO.wo_number,
        status: updatedWO.status,
        closed_at: updatedWO.closed_at,
        closed_by: updatedWO.closed_by,
        closed_source: updatedWO.closed_source,
        final_yields: finalYields
      }
    });

  } catch (error) {
    console.error('Error closing work order:', error);
    return NextResponse.json(
      { error: 'Failed to close work order' },
      { status: 500 }
    );
  }
}