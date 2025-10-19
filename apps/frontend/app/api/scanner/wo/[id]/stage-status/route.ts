import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client-browser';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const woId = parseInt(id);

    if (!woId || isNaN(woId)) {
      return NextResponse.json(
        { error: 'Invalid work order ID' },
        { status: 400 }
      );
    }

    // Get work order with materials and operations
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select(`
        *,
        wo_materials:wo_materials(
          sequence,
          quantity,
          one_to_one,
          is_optional,
          material:products(description, part_number)
        ),
        wo_operations:wo_operations(
          sequence,
          operation_name,
          actual_input_weight,
          actual_output_weight,
          status
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

    // Get active reservations for this work order
    const { data: reservations, error: resError } = await supabase
      .from('lp_reservations')
      .select(`
        *,
        license_plates!inner(product_id, quantity)
      `)
      .eq('wo_id', woId)
      .eq('status', 'active');

    if (resError) throw resError;

    // Calculate stage status for each operation
    const operations = woData.wo_operations?.map((op: any) => {
      // Get required materials for this operation
      const requiredMaterials = woData.wo_materials?.filter((mat: any) => 
        mat.sequence === op.sequence
      ) || [];

      const required_kg = requiredMaterials.reduce((sum: number, mat: any) => 
        sum + parseFloat(mat.quantity), 0
      );

      // Get staged quantity from reservations for this operation
      const stagedReservations = reservations?.filter((res: any) => {
        // This would need to be enhanced to match materials to reservations
        // For now, we'll use a simplified approach
        return true; // All reservations count as staged
      }) || [];

      const staged_kg = stagedReservations.reduce((sum: number, res: any) => 
        sum + parseFloat(res.qty), 0
      );

      // Get IN quantity from actual weights
      const in_kg = op.actual_input_weight ? parseFloat(op.actual_input_weight) : 0;

      // Calculate remaining
      const remaining_kg = Math.max(0, required_kg - in_kg);

      // Determine color code
      let color_code: 'green' | 'amber' | 'red';
      const percentage = required_kg > 0 ? (in_kg / required_kg) * 100 : 100;
      if (percentage >= 100) color_code = 'green';
      else if (percentage >= 90) color_code = 'amber';
      else color_code = 'red';

      return {
        seq: op.sequence,
        operation_name: op.operation_name,
        required_kg,
        staged_kg,
        in_kg,
        remaining_kg,
        color_code,
        one_to_one_components: requiredMaterials
          .filter((mat: any) => mat.one_to_one)
          .map((mat: any) => ({
            material_id: mat.material_id,
            material_name: mat.material?.description,
            material_part_number: mat.material?.part_number,
            one_to_one: mat.one_to_one,
            is_optional: mat.is_optional
          })),
        optional_components: requiredMaterials
          .filter((mat: any) => mat.is_optional)
          .map((mat: any) => ({
            material_id: mat.material_id,
            material_name: mat.material?.description,
            material_part_number: mat.material?.part_number,
            one_to_one: mat.one_to_one,
            is_optional: mat.is_optional
          })),
        status: op.status,
        can_start: op.sequence === woData.current_operation_seq,
        is_completed: op.actual_input_weight && op.actual_output_weight
      };
    }) || [];

    // Calculate overall stage status
    const total_required = operations.reduce((sum, op) => sum + op.required_kg, 0);
    const total_staged = operations.reduce((sum, op) => sum + op.staged_kg, 0);
    const total_in = operations.reduce((sum, op) => sum + op.in_kg, 0);
    const total_remaining = operations.reduce((sum, op) => sum + op.remaining_kg, 0);

    const overall_percentage = total_required > 0 ? (total_in / total_required) * 100 : 100;
    let overall_color: 'green' | 'amber' | 'red';
    if (overall_percentage >= 100) overall_color = 'green';
    else if (overall_percentage >= 90) overall_color = 'amber';
    else overall_color = 'red';

    return NextResponse.json({
      success: true,
      data: {
        wo_id: woId,
        wo_number: woData.wo_number,
        kpi_scope: woData.kpi_scope,
        current_operation_seq: woData.current_operation_seq,
        status: woData.status,
        operations,
        summary: {
          total_required_kg: total_required,
          total_staged_kg: total_staged,
          total_in_kg: total_in,
          total_remaining_kg: total_remaining,
          overall_percentage,
          overall_color,
          operations_completed: operations.filter(op => op.is_completed).length,
          operations_total: operations.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching stage status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stage status' },
      { status: 500 }
    );
  }
}