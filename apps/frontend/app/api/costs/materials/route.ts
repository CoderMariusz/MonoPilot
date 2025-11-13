/**
 * Material Costs API Routes - EPIC-003 Phase 1
 * Handles material cost tracking and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/costs/materials - Set or update material cost
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      product_id,
      cost,
      currency = 'USD',
      uom,
      effective_from,
      effective_to,
      source = 'manual',
      notes,
    } = body;

    // Validate required fields
    if (!product_id || cost === undefined || !uom || !effective_from) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, cost, uom, effective_from' },
        { status: 400 }
      );
    }

    // Validate cost is non-negative
    if (cost < 0) {
      return NextResponse.json(
        { error: 'Cost must be non-negative' },
        { status: 400 }
      );
    }

    // Get user ID for audit trail
    const { data: { user } } = await supabase.auth.getUser();

    // Insert material cost
    const { data: materialCost, error } = await supabase
      .from('material_costs')
      .insert({
        product_id,
        cost,
        currency,
        uom,
        effective_from,
        effective_to,
        source,
        notes,
        created_by: user?.id,
      })
      .select(`
        *,
        product:products(id, name, sku)
      `)
      .single();

    if (error) {
      console.error('Error creating material cost:', error);

      // Check for date range overlap error
      if (error.message.includes('overlaps')) {
        return NextResponse.json(
          { error: 'Material cost date range overlaps with existing range' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create material cost' },
        { status: 500 }
      );
    }

    return NextResponse.json(materialCost, { status: 201 });

  } catch (error) {
    console.error('Material cost POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/costs/materials/bulk - Get current costs for multiple products
 * Body: { product_ids: number[] }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Check if this is a bulk request
    const productIdsParam = searchParams.get('product_ids');

    if (productIdsParam) {
      // Parse product IDs from comma-separated string
      const productIds = productIdsParam.split(',').map(id => parseInt(id.trim()));

      if (productIds.some(isNaN)) {
        return NextResponse.json(
          { error: 'Invalid product_ids format' },
          { status: 400 }
        );
      }

      // Get current costs for all products
      const { data: costs, error } = await supabase
        .from('material_costs')
        .select('product_id, cost')
        .in('product_id', productIds)
        .is('effective_to', null)
        .order('effective_from', { ascending: false });

      if (error) {
        console.error('Error fetching material costs:', error);
        return NextResponse.json(
          { error: 'Failed to fetch material costs' },
          { status: 500 }
        );
      }

      // Convert to map format { product_id: cost }
      const costMap: Record<number, number> = {};
      costs?.forEach(c => {
        if (!costMap[c.product_id]) {
          costMap[c.product_id] = c.cost;
        }
      });

      return NextResponse.json(costMap);
    }

    // If no product_ids, return error
    return NextResponse.json(
      { error: 'Missing required parameter: product_ids' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Material costs GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
