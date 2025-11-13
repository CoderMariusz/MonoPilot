/**
 * BOM Cost Calculation API Route - EPIC-003 Phase 1
 * Calculate BOM cost with material breakdown using RPC function
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/costs/bom/calculate
 * Body: { bom_id: number, as_of_date?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { bom_id, as_of_date } = body;

    // Validate required fields
    if (!bom_id) {
      return NextResponse.json(
        { error: 'Missing required field: bom_id' },
        { status: 400 }
      );
    }

    // Use current date if not provided
    const calculationDate = as_of_date || new Date().toISOString();

    // Call RPC function to calculate BOM cost
    const { data, error } = await supabase.rpc('calculate_bom_cost', {
      p_bom_id: bom_id,
      p_as_of_date: calculationDate,
    });

    if (error) {
      console.error('Error calculating BOM cost:', error);
      return NextResponse.json(
        { error: 'Failed to calculate BOM cost' },
        { status: 500 }
      );
    }

    // If no data returned, BOM might not exist or have no items
    if (!data) {
      return NextResponse.json(
        { error: 'BOM not found or has no items' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('BOM cost calculation POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
