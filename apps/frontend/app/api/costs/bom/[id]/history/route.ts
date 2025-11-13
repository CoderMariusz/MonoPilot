/**
 * BOM Cost History API Route - EPIC-003 Phase 1
 * Get BOM cost history (snapshots)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/costs/bom/[id]/history - Get BOM cost history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const bomId = parseInt(params.id);

    if (isNaN(bomId)) {
      return NextResponse.json(
        { error: 'Invalid BOM ID' },
        { status: 400 }
      );
    }

    // Get all cost snapshots for this BOM, ordered by creation date descending
    const { data: snapshots, error } = await supabase
      .from('bom_costs')
      .select(`
        *,
        bom:boms(id, name, version, product_id, products(name, sku))
      `)
      .eq('bom_id', bomId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching BOM cost history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch BOM cost history' },
        { status: 500 }
      );
    }

    return NextResponse.json(snapshots || []);

  } catch (error) {
    console.error('BOM cost history GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
