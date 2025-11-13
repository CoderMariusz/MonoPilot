/**
 * WO Actual Cost API Route - EPIC-003 Phase 1
 * Calculate actual cost for a work order based on consumed materials
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/costs/wo/[id]/actual - Calculate actual cost for a work order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const woId = parseInt(id);

    if (isNaN(woId)) {
      return NextResponse.json(
        { error: 'Invalid work order ID' },
        { status: 400 }
      );
    }

    // Get work order details
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, wo_number, qty_produced')
      .eq('id', woId)
      .single();

    if (woError || !wo) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Get consumed license plates (via lp_genealogy)
    const { data: consumedLPs, error: consumedError } = await supabase
      .from('lp_genealogy')
      .select(
        `
        parent_lp_id,
        license_plates!lp_genealogy_parent_lp_id_fkey(
          product_id,
          quantity,
          manufacture_date
        )
      `
      )
      .eq('consumed_by_wo_id', woId);

    if (consumedError) {
      console.error('Error fetching consumed LPs:', consumedError);
      return NextResponse.json(
        { error: 'Failed to fetch consumed materials' },
        { status: 500 }
      );
    }

    // Calculate actual cost from consumed LPs
    let totalMaterialCost = 0;
    const materialBreakdown: any[] = [];

    for (const consumed of consumedLPs || []) {
      const lp = (consumed as any).license_plates;
      if (!lp) continue;

      // Get material cost at LP manufacture date
      const { data: costData } = await supabase.rpc(
        'get_material_cost_at_date',
        {
          p_product_id: lp.product_id,
          p_date: lp.manufacture_date,
        }
      );

      const unitCost = costData || 0;
      const totalCost = unitCost * lp.quantity;

      totalMaterialCost += totalCost;

      // Find if this product is already in breakdown
      const existing = materialBreakdown.find(
        m => m.product_id === lp.product_id
      );
      if (existing) {
        existing.total_qty += lp.quantity;
        existing.total_cost += totalCost;
      } else {
        materialBreakdown.push({
          product_id: lp.product_id,
          total_qty: lp.quantity,
          unit_cost: unitCost,
          total_cost: totalCost,
        });
      }
    }

    // Get user ID for audit trail
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Update WO cost record with actual costs
    const { data: woCost, error: costError } = await supabase
      .from('wo_costs')
      .upsert(
        {
          wo_id: woId,
          actual_cost: totalMaterialCost,
          actual_material_cost: totalMaterialCost,
          actual_labor_cost: 0, // TODO: Add labor tracking
          actual_overhead_cost: 0, // TODO: Add overhead tracking
          material_breakdown_json: materialBreakdown,
          updated_by: user?.id,
        },
        {
          onConflict: 'wo_id',
        }
      )
      .select()
      .single();

    if (costError) {
      console.error('Error saving WO actual cost:', costError);
      return NextResponse.json(
        { error: 'Failed to save WO actual cost' },
        { status: 500 }
      );
    }

    return NextResponse.json(woCost, { status: 201 });
  } catch (error) {
    console.error('WO actual cost POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
