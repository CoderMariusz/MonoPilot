/**
 * Product Cost Trend API Route - EPIC-003 Phase 1
 * Get cost trend for a product over time
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/costs/trends/product/[id]?days=90
 * Get cost trend for a product (defaults to last 90 days)
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

    // Get days parameter (defaults to 90)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');

    // Call RPC function to get cost trend
    const { data, error } = await supabase.rpc('get_product_cost_trend', {
      p_product_id: productId,
      p_days: days,
    });

    if (error) {
      console.error('Error fetching product cost trend:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product cost trend' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Product cost trend GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
