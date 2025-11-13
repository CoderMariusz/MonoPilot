/**
 * WO Planned Cost API Route - EPIC-003 Phase 1
 * Calculate planned cost for a work order based on BOM snapshot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/costs/wo/[id]/planned - Calculate planned cost for a work order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const woId = parseInt(params.id);

    if (isNaN(woId)) {
      return NextResponse.json(
        { error: 'Invalid work order ID' },
        { status: 400 }
      );
    }

    // Get work order details
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, wo_number, qty_planned, scheduled_date, bom_id')
      .eq('id', woId)
      .single();

    if (woError || !wo) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Get WO materials (BOM snapshot)
    const { data: materials, error: materialsError } = await supabase
      .from('wo_materials')
      .select('item_id, qty_per_unit')
      .eq('wo_id', woId);

    if (materialsError) {
      console.error('Error fetching WO materials:', materialsError);
      return NextResponse.json(
        { error: 'Failed to fetch work order materials' },
        { status: 500 }
      );
    }

    // Calculate planned cost
    let totalMaterialCost = 0;
    const materialBreakdown: any[] = [];

    for (const material of materials || []) {
      // Get material cost at WO scheduled date
      const { data: costData } = await supabase.rpc('get_material_cost_at_date', {
        p_product_id: material.item_id,
        p_date: wo.scheduled_date,
      });

      const unitCost = costData || 0;
      const totalQty = material.qty_per_unit * wo.qty_planned;
      const totalCost = unitCost * totalQty;

      totalMaterialCost += totalCost;

      materialBreakdown.push({
        item_id: material.item_id,
        qty_per_unit: material.qty_per_unit,
        total_qty: totalQty,
        unit_cost: unitCost,
        total_cost: totalCost,
      });
    }

    // Get user ID for audit trail
    const { data: { user } } = await supabase.auth.getUser();

    // Save or update WO cost record
    const { data: woCost, error: costError } = await supabase
      .from('wo_costs')
      .upsert({
        wo_id: woId,
        planned_cost: totalMaterialCost,
        planned_material_cost: totalMaterialCost,
        planned_labor_cost: 0, // TODO: Add labor cost calculation
        planned_overhead_cost: 0, // TODO: Add overhead cost calculation
        material_breakdown_json: materialBreakdown,
        created_by: user?.id,
      }, {
        onConflict: 'wo_id',
      })
      .select()
      .single();

    if (costError) {
      console.error('Error saving WO planned cost:', costError);
      return NextResponse.json(
        { error: 'Failed to save WO planned cost' },
        { status: 500 }
      );
    }

    return NextResponse.json(woCost, { status: 201 });

  } catch (error) {
    console.error('WO planned cost POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
