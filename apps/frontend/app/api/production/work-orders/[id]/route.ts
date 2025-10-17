import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string } } }
) {
  const { id } = await params;
  try {
    const { data: workOrder, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        products!inner(description, part_number, uom),
        machines(name, code, type),
        users!work_orders_created_by_fkey(name, email),
        wo_operations(
          id,
          seq_no,
          name,
          status,
          planned_input_weight,
          planned_output_weight,
          actual_input_weight,
          actual_output_weight,
          cooking_loss_weight,
          trim_loss_weight,
          marinade_gain_weight,
          scrap_breakdown,
          started_at,
          finished_at,
          operator_id,
          users!wo_operations_operator_id_fkey(name, email)
        ),
        production_outputs(
          id,
          product_id,
          quantity,
          uom,
          boxes,
          created_at,
          products!inner(description, part_number)
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      throw error;
    }

    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Calculate comprehensive metrics
    const totalInputWeight = workOrder.wo_operations?.reduce((sum, op) => 
      sum + (op.actual_input_weight || 0), 0) || 0;
    const totalOutputWeight = workOrder.wo_operations?.reduce((sum, op) => 
      sum + (op.actual_output_weight || 0), 0) || 0;
    const totalCookingLoss = workOrder.wo_operations?.reduce((sum, op) => 
      sum + (op.cooking_loss_weight || 0), 0) || 0;
    const totalTrimLoss = workOrder.wo_operations?.reduce((sum, op) => 
      sum + (op.trim_loss_weight || 0), 0) || 0;
    const totalMarinadeGain = workOrder.wo_operations?.reduce((sum, op) => 
      sum + (op.marinade_gain_weight || 0), 0) || 0;

    const yieldPercentage = totalInputWeight > 0 ? (totalOutputWeight / totalInputWeight) * 100 : 0;
    const planAccuracy = workOrder.quantity > 0 ? (workOrder.actual_output_qty / workOrder.quantity) * 100 : 0;

    const enrichedWorkOrder = {
      ...workOrder,
      metrics: {
        yield_percentage: Math.round(yieldPercentage * 100) / 100,
        plan_accuracy: Math.round(planAccuracy * 100) / 100,
        total_input_weight: totalInputWeight,
        total_output_weight: totalOutputWeight,
        total_cooking_loss: totalCookingLoss,
        total_trim_loss: totalTrimLoss,
        total_marinade_gain: totalMarinadeGain,
        net_weight_change: totalOutputWeight - totalInputWeight,
        operation_count: workOrder.wo_operations?.length || 0,
        completed_operations: workOrder.wo_operations?.filter(op => op.status === 'COMPLETED').length || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: enrichedWorkOrder
    });

  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch work order' 
      },
      { status: 500 }
    );
  }
}
