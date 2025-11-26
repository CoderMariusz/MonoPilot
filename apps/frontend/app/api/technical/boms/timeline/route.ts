import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { BOMTimelineQuerySchema, type BOMStatus, type BOMTimelineData } from '@/lib/validation/bom-schemas';
import { ZodError } from 'zod';

/**
 * BOM Timeline API Routes
 * Story: 2.9 BOM Timeline Visualization
 *
 * GET /api/technical/boms/timeline?product_id=<id> - Get timeline for product BOMs
 */

// ============================================================================
// Helper: Get color for BOM status
// ============================================================================

function getStatusColor(status: BOMStatus): string {
  switch (status) {
    case 'Active':
      return 'green';
    case 'Draft':
      return 'gray';
    case 'Phased Out':
      return 'orange';
    case 'Inactive':
      return 'red';
    default:
      return 'gray';
  }
}

// ============================================================================
// GET /api/technical/boms/timeline - Get timeline (AC-2.9.1-2.9.4)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = {
      product_id: searchParams.get('product_id') || '',
    };

    const validatedQuery = BOMTimelineQuerySchema.parse(query);

    // Verify product exists and user has access
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, code, name')
      .eq('id', validatedQuery.product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Fetch all BOMs for this product
    const { data: boms, error: bomsError } = await supabase
      .from('boms')
      .select('id, version, effective_from, effective_to, status')
      .eq('product_id', validatedQuery.product_id)
      .order('effective_from', { ascending: true });

    if (bomsError) {
      console.error('Error fetching BOMs for timeline:', bomsError);
      throw new Error(`Failed to fetch BOMs: ${bomsError.message}`);
    }

    // Transform to timeline format
    const timelineData: BOMTimelineData = {
      boms: (boms || []).map(bom => ({
        id: bom.id,
        version: bom.version,
        effective_from: bom.effective_from,
        effective_to: bom.effective_to,
        status: bom.status as BOMStatus,
        color: getStatusColor(bom.status as BOMStatus),
      })),
    };

    return NextResponse.json(
      {
        timeline: timelineData,
        product: {
          id: product.id,
          code: product.code,
          name: product.name,
        },
        total_versions: timelineData.boms.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/technical/boms/timeline:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
