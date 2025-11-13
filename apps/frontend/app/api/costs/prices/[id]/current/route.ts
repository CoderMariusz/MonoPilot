/**
 * Current Product Price API Route - EPIC-003 Phase 1
 * Get current product price
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/costs/prices/[id]/current?type=wholesale
 * Get current product price (defaults to wholesale)
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

    // Get price type (defaults to wholesale)
    const { searchParams } = new URL(request.url);
    const priceType = searchParams.get('type') || 'wholesale';

    // Get current price (effective_to is NULL)
    const { data: priceData, error } = await supabase
      .from('product_prices')
      .select('price, currency, price_type')
      .eq('product_id', productId)
      .eq('price_type', priceType)
      .is('effective_to', null)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no price found, return 0
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          product_id: productId,
          price_type: priceType,
          price: 0,
          currency: 'USD',
        });
      }

      console.error('Error fetching current product price:', error);
      return NextResponse.json(
        { error: 'Failed to fetch current product price' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      product_id: productId,
      price_type: priceData.price_type,
      price: priceData.price,
      currency: priceData.currency,
    });
  } catch (error) {
    console.error('Current product price GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
