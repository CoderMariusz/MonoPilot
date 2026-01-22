/**
 * Incoming Inspections API Route
 * Story: 06.5 - Incoming Inspection
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/inspections/incoming - Get incoming inspection queue
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.5.incoming-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { inspectionListQuerySchema } from '@/lib/validation/inspection';
import { ZodError } from 'zod';
import * as InspectionService from '@/lib/services/inspection-service';

/**
 * GET /api/quality/inspections/incoming
 * Get incoming inspections (type='incoming')
 *
 * Query params: status, priority, inspector_id, product_id,
 *               lp_id, grn_id, po_id, date_from, date_to, search,
 *               sort_by, sort_order, page, limit
 *
 * Response:
 * - 200: { inspections: [], pagination: {} }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest) {
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

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      inspection_type: 'incoming', // Force incoming type
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      inspector_id: searchParams.get('inspector_id') || undefined,
      product_id: searchParams.get('product_id') || undefined,
      lp_id: searchParams.get('lp_id') || undefined,
      grn_id: searchParams.get('grn_id') || undefined,
      po_id: searchParams.get('po_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || 'scheduled_date',
      sort_order: searchParams.get('sort_order') || 'desc',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    const validatedParams = inspectionListQuerySchema.parse(queryParams);

    // Get inspections
    const result = await InspectionService.list(validatedParams);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/quality/inspections/incoming:', error);

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
