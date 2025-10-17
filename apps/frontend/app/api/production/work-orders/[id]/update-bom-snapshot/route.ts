import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Check if work order exists
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

    // Check if work order is in a state that allows BOM updates
    if (woData.status === 'completed' || woData.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot update BOM snapshot for completed or cancelled work order' },
        { status: 400 }
      );
    }

    // Get current BOM snapshot
    const { data: currentMaterials, error: materialsError } = await supabase
      .from('wo_materials')
      .select('*')
      .eq('wo_id', woId);

    if (materialsError) throw materialsError;

    // Call the BOM snapshot update function
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_wo_bom_snapshot', {
        wo_id_param: woId,
        user_id_param: user_id
      });

    if (updateError) throw updateError;

    // Get updated materials
    const { data: updatedMaterials, error: updatedError } = await supabase
      .from('wo_materials')
      .select(`
        *,
        material:products(description, part_number)
      `)
      .eq('wo_id', woId)
      .order('sequence');

    if (updatedError) throw updatedError;

    // Log the BOM update
    await supabase
      .from('work_orders_audit')
      .insert({
        wo_id: woId,
        action: 'BOM_SNAPSHOT_UPDATED',
        details: {
          old_materials_count: currentMaterials?.length || 0,
          new_materials_count: updatedMaterials?.length || 0,
          reason: reason,
          updated_by: user_id,
          materials: updatedMaterials?.map(mat => ({
            material_id: mat.material_id,
            material_name: mat.material?.description,
            quantity: mat.quantity,
            one_to_one: mat.one_to_one,
            sequence: mat.sequence
          }))
        },
        created_by: user_id
      });

    return NextResponse.json({
      success: true,
      message: 'BOM snapshot updated successfully',
      data: {
        wo_id: woId,
        wo_number: woData.wo_number,
        old_materials_count: currentMaterials?.length || 0,
        new_materials_count: updatedMaterials?.length || 0,
        materials: updatedMaterials?.map(mat => ({
          id: mat.id,
          material_id: mat.material_id,
          material_name: mat.material?.description,
          material_part_number: mat.material?.part_number,
          quantity: parseFloat(mat.quantity),
          uom: mat.uom,
          sequence: mat.sequence,
          one_to_one: mat.one_to_one,
          is_optional: mat.is_optional,
          substitution_group: mat.substitution_group
        }))
      }
    });

  } catch (error) {
    console.error('Error updating BOM snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to update BOM snapshot' },
      { status: 500 }
    );
  }
}
