/**
 * Material Cost History API Route - EPIC-003 Phase 1
 * Get material cost history for a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/costs/materials/[id]/history - Get material cost history for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get all material costs for the product, ordered by effective_from descending
    const { data: costs, error } = await supabase
      .from('material_costs')
      .select(
        `
        *,
        product:products(id, name, sku)
      `
      )
      .eq('product_id', productId)
      .order('effective_from', { ascending: false });

    if (error) {
      console.error('Error fetching material cost history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch material cost history' },
        { status: 500 }
      );
    }

    return NextResponse.json(costs || []);
  } catch (error) {
    console.error('Material cost history GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
