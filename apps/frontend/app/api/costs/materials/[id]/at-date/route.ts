/**
 * Material Cost At Date API Route - EPIC-003 Phase 1
 * Get material cost at a specific date using RPC function
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/costs/materials/[id]/at-date?date=YYYY-MM-DD
 * Get material cost at a specific date (defaults to NOW)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get date parameter (optional, defaults to NOW)
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString();

    // Call RPC function to get cost at date
    const { data, error } = await supabase.rpc('get_material_cost_at_date', {
      p_product_id: productId,
      p_date: date,
    });

    if (error) {
      console.error('Error fetching material cost at date:', error);
      return NextResponse.json(
        { error: 'Failed to fetch material cost at date' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      product_id: productId,
      date: date,
      cost: data || 0,
    });

  } catch (error) {
    console.error('Material cost at-date GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
