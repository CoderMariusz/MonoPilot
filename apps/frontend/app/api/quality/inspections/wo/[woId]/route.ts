/**
 * WO Inspections API Route
 * Story: 06.10 - In-Process Inspection
 * Phase: P4 - Refactoring (GREEN)
 *
 * Routes:
 * - GET /api/quality/inspections/wo/:woId - Get all inspections for a Work Order
 *
 * Refactored to use auth-middleware for DRY auth handling.
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.10.in-process-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import * as InProcessInspectionService from '@/lib/services/in-process-inspection-service';
import { getAuthContext, isValidUUID } from '@/lib/api/auth-middleware';
import { handleApiError, notFoundResponse } from '@/lib/api/error-handler';

interface RouteParams {
  params: Promise<{ woId: string }>;
}

/**
 * GET /api/quality/inspections/wo/:woId
 * Get all inspections for a Work Order with quality summary
 *
 * Response:
 * - 200: { wo: {...}, inspections: [...], summary: {...} }
 * - 400: { success: false, error: { code, message } }
 * - 401: { success: false, error: { code: 'UNAUTHORIZED', message } }
 * - 404: { success: false, error: { code: 'NOT_FOUND', message } }
 * - 500: { success: false, error: { code, message } }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { woId } = await params;

    // Check authentication
    const auth = await getAuthContext();
    if (auth instanceof NextResponse) {
      return auth;
    }

    // Validate UUID format
    if (!isValidUUID(woId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid Work Order ID' } },
        { status: 400 }
      );
    }

    // Get WO inspections
    const result = await InProcessInspectionService.getByWorkOrder(auth.orgId, woId);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InProcessInspectionService.NotFoundError) {
      return notFoundResponse(error.message);
    }
    return handleApiError(error, 'GET /api/quality/inspections/wo/:woId');
  }
}
