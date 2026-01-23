/**
 * In-Process Inspections Queue API Route
 * Story: 06.10 - In-Process Inspection
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/inspections/in-process - List in-process inspections with filters
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.10.in-process-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { inProcessListQuerySchema } from '@/lib/validation/in-process-inspection';
import * as InProcessInspectionService from '@/lib/services/in-process-inspection-service';
import { ZodError } from 'zod';

/**
 * GET /api/quality/inspections/in-process
 * List in-process inspections with filters and pagination
 *
 * Query params: wo_id, wo_operation_id, status, priority, inspector_id,
 *               product_id, date_from, date_to, search,
 *               sort_by, sort_order, page, limit
 *
 * Response:
 * - 200: { data: [], total: number, page: number, limit: number }
 * - 400: { error: string }
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

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      wo_id: searchParams.get('wo_id') || undefined,
      wo_operation_id: searchParams.get('wo_operation_id') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      inspector_id: searchParams.get('inspector_id') || undefined,
      product_id: searchParams.get('product_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || 'scheduled_date',
      sort_order: searchParams.get('sort_order') || 'desc',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    const validatedParams = inProcessListQuerySchema.parse(queryParams);

    // Get inspections
    const result = await InProcessInspectionService.listInProcess(
      userData.org_id,
      validatedParams
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/quality/inspections/in-process:', error);

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
