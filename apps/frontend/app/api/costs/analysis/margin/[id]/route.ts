/**
 * Margin Analysis API Route - EPIC-003 Phase 1
 * Get margin analysis for a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/costs/analysis/margin/[id]?price_type=wholesale
 * Get margin analysis for a product
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
    const priceType = searchParams.get('price_type') || 'wholesale';

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, sku')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get current material cost
    const { data: costData } = await supabase.rpc('get_material_cost_at_date', {
      p_product_id: productId,
      p_date: new Date().toISOString(),
    });

    const cost = costData || 0;

    // Get current price
    const { data: priceData } = await supabase
      .from('product_prices')
      .select('price, currency')
      .eq('product_id', productId)
      .eq('price_type', priceType)
      .is('effective_to', null)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    const price = priceData?.price || 0;
    const currency = priceData?.currency || 'USD';

    // Calculate margin
    const margin = price - cost;
    const marginPercent = price > 0 ? (margin / price) * 100 : 0;

    return NextResponse.json({
      product_id: productId,
      product_name: product.name,
      sku: product.sku,
      cost,
      price,
      margin,
      margin_percent: marginPercent,
      currency,
      price_type: priceType,
    });
  } catch (error) {
    console.error('Margin analysis GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
