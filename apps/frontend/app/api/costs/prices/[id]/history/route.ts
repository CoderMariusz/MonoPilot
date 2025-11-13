/**
 * Product Price History API Route - EPIC-003 Phase 1
 * Get product price history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/costs/prices/[id]/history?type=wholesale
 * Get product price history for a product (optionally filtered by price type)
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

    // Get optional price_type filter
    const { searchParams } = new URL(request.url);
    const priceType = searchParams.get('type');

    // Build query
    let query = supabase
      .from('product_prices')
      .select(
        `
        *,
        product:products(id, name, sku)
      `
      )
      .eq('product_id', productId)
      .order('effective_from', { ascending: false });

    // Apply price type filter if provided
    if (priceType) {
      query = query.eq('price_type', priceType);
    }

    const { data: prices, error } = await query;

    if (error) {
      console.error('Error fetching product price history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product price history' },
        { status: 500 }
      );
    }

    return NextResponse.json(prices || []);
  } catch (error) {
    console.error('Product price history GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
