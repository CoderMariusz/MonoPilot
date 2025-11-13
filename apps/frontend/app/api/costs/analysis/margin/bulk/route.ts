/**
 * Bulk Margin Analysis API Route - EPIC-003 Phase 1
 * Get margin analysis for multiple products
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/costs/analysis/margin/bulk
 * Body: { product_ids: number[], price_type?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { product_ids, price_type = 'wholesale' } = body;

    // Validate required fields
    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid product_ids array' },
        { status: 400 }
      );
    }

    // Get product details
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku')
      .in('id', product_ids);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Get current material costs for all products
    const { data: costs, error: costsError } = await supabase
      .from('material_costs')
      .select('product_id, cost, currency')
      .in('product_id', product_ids)
      .is('effective_to', null)
      .order('effective_from', { ascending: false });

    if (costsError) {
      console.error('Error fetching material costs:', costsError);
    }

    // Create cost map (take most recent cost for each product)
    const costMap: Record<number, { cost: number; currency: string }> = {};
    costs?.forEach(c => {
      if (!costMap[c.product_id]) {
        costMap[c.product_id] = { cost: c.cost, currency: c.currency };
      }
    });

    // Get current prices for all products
    const { data: prices, error: pricesError } = await supabase
      .from('product_prices')
      .select('product_id, price, currency')
      .in('product_id', product_ids)
      .eq('price_type', price_type)
      .is('effective_to', null)
      .order('effective_from', { ascending: false });

    if (pricesError) {
      console.error('Error fetching product prices:', pricesError);
    }

    // Create price map (take most recent price for each product)
    const priceMap: Record<number, { price: number; currency: string }> = {};
    prices?.forEach(p => {
      if (!priceMap[p.product_id]) {
        priceMap[p.product_id] = { price: p.price, currency: p.currency };
      }
    });

    // Build margin analysis results
    const results = products?.map(product => {
      const cost = costMap[product.id]?.cost || 0;
      const price = priceMap[product.id]?.price || 0;
      const currency = priceMap[product.id]?.currency || costMap[product.id]?.currency || 'USD';

      const margin = price - cost;
      const marginPercent = price > 0 ? (margin / price) * 100 : 0;

      return {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        cost,
        price,
        margin,
        margin_percent: marginPercent,
        currency,
        price_type,
      };
    }) || [];

    return NextResponse.json(results);

  } catch (error) {
    console.error('Bulk margin analysis POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
