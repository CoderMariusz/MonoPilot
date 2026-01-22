/**
 * Active Specification API Route
 * Story: 06.3 - Product Specifications
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/specifications/product/:productId/active - Get active specification
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
 * GET /api/quality/specifications/product/:productId/active
 * Get active specification for a product
 *
 * Query params (optional):
 * - as_of_date: string (YYYY-MM-DD) - Date to check active spec against
 *
 * Response:
 * - 200: { specification: {} }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'No active specification found for this product' }
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

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { productId } = await context.params;

    // Parse optional as_of_date query param
    const asOfDateStr = request.nextUrl.searchParams.get('as_of_date');
    const asOfDate = asOfDateStr ? new Date(asOfDateStr) : undefined;

    // Get active specification
    const specification = await SpecificationService.getActiveForProduct(
      userData.org_id,
      productId,
      asOfDate
    );

    if (!specification) {
      return NextResponse.json(
        { error: 'No active specification found for this product' },
        { status: 404 }
      );
    }

    return NextResponse.json({ specification });
  } catch (error) {
    console.error(
      'Error in GET /api/quality/specifications/product/:productId/active:',
      error
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
