/**
 * BOM Cost Snapshot API Route - EPIC-003 Phase 1
 * Save BOM cost snapshot for historical tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/costs/bom/[id]/snapshot - Save BOM cost snapshot
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const bomId = parseInt(id);

    if (isNaN(bomId)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    // First, calculate the current BOM cost
    const { data: costData, error: calcError } = await supabase.rpc(
      'calculate_bom_cost',
      {
        p_bom_id: bomId,
        p_as_of_date: new Date().toISOString(),
      }
    );

    if (calcError || !costData) {
      console.error('Error calculating BOM cost for snapshot:', calcError);
      return NextResponse.json(
        { error: 'Failed to calculate BOM cost for snapshot' },
        { status: 500 }
      );
    }

    // Get user ID for audit trail
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Save the snapshot
    const { data: snapshot, error: insertError } = await supabase
      .from('bom_costs')
      .insert({
        bom_id: bomId,
        total_cost: costData.total_cost,
        material_cost: costData.material_cost,
        labor_cost: 0, // TODO: Add labor cost calculation
        overhead_cost: 0, // TODO: Add overhead cost calculation
        currency: costData.currency || 'USD',
        material_costs_json: costData.materials || [],
        notes: `Snapshot created at ${new Date().toISOString()}`,
        created_by: user?.id,
      })
      .select(
        `
        *,
        bom:boms(id, name, version, product_id, products(name, sku))
      `
      )
      .single();

    if (insertError) {
      console.error('Error saving BOM cost snapshot:', insertError);
      return NextResponse.json(
        { error: 'Failed to save BOM cost snapshot' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'BOM cost snapshot saved successfully',
        data: snapshot,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('BOM cost snapshot POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
