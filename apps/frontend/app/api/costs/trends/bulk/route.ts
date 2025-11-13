/**
 * Bulk Cost Trends API Route - EPIC-003 Phase 1
 * Get cost trends for multiple products
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/costs/trends/bulk
 * Body: { product_ids: number[], days?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { product_ids, days = 90 } = body;

    // Validate required fields
    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid product_ids array' },
        { status: 400 }
      );
    }

    // Get cost trends for all products
    const results: Record<number, any[]> = {};

    // Call RPC function for each product
    // Note: This could be optimized with a bulk RPC function in the future
    for (const productId of product_ids) {
      const { data, error } = await supabase.rpc('get_product_cost_trend', {
        p_product_id: productId,
        p_days: days,
      });

      if (error) {
        console.error(`Error fetching cost trend for product ${productId}:`, error);
        results[productId] = [];
      } else {
        results[productId] = data || [];
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Bulk cost trends POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
