/**
 * BOM Cost Comparison API Route - EPIC-003 Phase 1
 * Compare costs between two BOM versions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/costs/bom/compare
 * Body: { bom_id_1: number, bom_id_2: number, as_of_date?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { bom_id_1, bom_id_2, as_of_date } = body;

    // Validate required fields
    if (!bom_id_1 || !bom_id_2) {
      return NextResponse.json(
        { error: 'Missing required fields: bom_id_1, bom_id_2' },
        { status: 400 }
      );
    }

    // Use current date if not provided
    const comparisonDate = as_of_date || new Date().toISOString();

    // Call RPC function to compare BOM costs
    const { data, error } = await supabase.rpc('compare_bom_costs', {
      p_bom_id_1: bom_id_1,
      p_bom_id_2: bom_id_2,
      p_as_of_date: comparisonDate,
    });

    if (error) {
      console.error('Error comparing BOM costs:', error);
      return NextResponse.json(
        { error: 'Failed to compare BOM costs' },
        { status: 500 }
      );
    }

    // If no data returned, one or both BOMs might not exist
    if (!data) {
      return NextResponse.json(
        { error: 'One or both BOMs not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('BOM cost comparison POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
