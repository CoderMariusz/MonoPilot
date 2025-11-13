/**
 * Product Price Delete API Route - EPIC-003 Phase 1
 * Delete a product price entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/costs/prices/[id] - Delete product price entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const priceId = parseInt(id);

    if (isNaN(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    // Delete the product price
    const { error } = await supabase
      .from('product_prices')
      .delete()
      .eq('id', priceId);

    if (error) {
      console.error('Error deleting product price:', error);
      return NextResponse.json(
        { error: 'Failed to delete product price' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Product price deleted successfully',
    });
  } catch (error) {
    console.error('Product price DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
