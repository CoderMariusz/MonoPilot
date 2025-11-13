/**
 * WO Cost Variance API Route - EPIC-003 Phase 1
 * Get cost variance for a work order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/costs/wo/[id]/variance - Get WO cost variance
 */
export async function GET(
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

    // Get WO cost data
    const { data: woCost, error } = await supabase
      .from('wo_costs')
      .select(
        `
        *,
        work_order:work_orders(
          id,
          wo_number,
          status,
          qty_planned,
          qty_produced,
          product_id,
          products(name, sku)
        )
      `
      )
      .eq('wo_id', woId)
      .single();

    if (error) {
      // If no cost record found, return not found
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'WO cost data not found. Run cost calculation first.' },
          { status: 404 }
        );
      }

      console.error('Error fetching WO cost variance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch WO cost variance' },
        { status: 500 }
      );
    }

    // cost_variance and variance_percent are calculated by DB (GENERATED columns)
    return NextResponse.json(woCost);
  } catch (error) {
    console.error('WO cost variance GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
