/**
 * In-Process Inspections Queue API Route
 * Story: 06.10 - In-Process Inspection
 * Phase: P4 - Refactoring (GREEN)
 *
 * Routes:
 * - GET /api/quality/inspections/in-process - List in-process inspections with filters
 *
 * Refactored to use auth-middleware for DRY auth handling.
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.10.in-process-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { inProcessListQuerySchema } from '@/lib/validation/in-process-inspection';
import * as InProcessInspectionService from '@/lib/services/in-process-inspection-service';
import { getAuthContext } from '@/lib/api/auth-middleware';
import { handleApiError } from '@/lib/api/error-handler';

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
 * - 400: { success: false, error: { code, message, details } }
 * - 401: { success: false, error: { code: 'UNAUTHORIZED', message } }
 * - 500: { success: false, error: { code, message } }
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const auth = await getAuthContext();
    if (auth instanceof NextResponse) {
      return auth;
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
    const result = await InProcessInspectionService.listInProcess(auth.orgId, validatedParams);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'GET /api/quality/inspections/in-process');
  }
}
