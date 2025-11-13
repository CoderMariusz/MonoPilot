/**
 * Product Prices API Routes - EPIC-003 Phase 1
 * Handles product pricing and price history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/costs/prices - Set or update product price
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      product_id,
      price,
      price_type = 'wholesale',
      currency = 'USD',
      effective_from,
      effective_to,
      notes,
    } = body;

    // Validate required fields
    if (!product_id || price === undefined || !effective_from) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, price, effective_from' },
        { status: 400 }
      );
    }

    // Validate price is non-negative
    if (price < 0) {
      return NextResponse.json(
        { error: 'Price must be non-negative' },
        { status: 400 }
      );
    }

    // Validate price type
    const validPriceTypes = ['wholesale', 'retail', 'export', 'internal', 'custom'];
    if (!validPriceTypes.includes(price_type)) {
      return NextResponse.json(
        { error: `Invalid price_type. Must be one of: ${validPriceTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user ID for audit trail
    const { data: { user } } = await supabase.auth.getUser();

    // Insert product price
    const { data: productPrice, error } = await supabase
      .from('product_prices')
      .insert({
        product_id,
        price,
        price_type,
        currency,
        effective_from,
        effective_to,
        notes,
        created_by: user?.id,
      })
      .select(`
        *,
        product:products(id, name, sku)
      `)
      .single();

    if (error) {
      console.error('Error creating product price:', error);

      // Check for date range overlap error
      if (error.message.includes('overlaps')) {
        return NextResponse.json(
          { error: 'Product price date range overlaps with existing range for this price type' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create product price' },
        { status: 500 }
      );
    }

    return NextResponse.json(productPrice, { status: 201 });

  } catch (error) {
    console.error('Product price POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
