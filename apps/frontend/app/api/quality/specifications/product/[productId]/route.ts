/**
 * Product Specifications API Route
 * Story: 06.3 - Product Specifications
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/specifications/product/:productId - Get all specifications for product
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.3.product-specifications.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import * as SpecificationService from '@/lib/services/specification-service';

interface RouteContext {
  params: Promise<{ productId: string }>;
}

/**
 * GET /api/quality/specifications/product/:productId
 * Get all specifications for a product
 *
 * Response:
 * - 200: { specifications: [], active_spec_id: string? }
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await context.params;

    // Get specifications for product
    const result = await SpecificationService.getForProduct(productId);

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      'Error in GET /api/quality/specifications/product/:productId:',
      error
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
