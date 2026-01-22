/**
 * Inspection Start API Route
 * Story: 06.5 - Incoming Inspection
 * Phase: P4 - Refactoring (GREEN)
 *
 * Routes:
 * - POST /api/quality/inspections/:id/start - Start inspection workflow
 *
 * Refactored to use auth-middleware and error-handler utilities
 * to reduce code duplication across API routes.
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.5.incoming-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { startInspectionSchema } from '@/lib/validation/inspection';
import * as InspectionService from '@/lib/services/inspection-service';
import { getAuthContext, checkInspectorPermission, isAdminRole } from '@/lib/api/auth-middleware';
import { handleApiError, forbiddenResponse } from '@/lib/api/error-handler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/quality/inspections/:id/start
 * Start inspection (scheduled -> in_progress)
 *
 * Request Body (optional):
 * - take_over: boolean (default: false) - Take over from assigned inspector
 *
 * Response:
 * - 200: { success: true, data: { inspection } }
 * - 400: { success: false, error: { code, message, details } }
 * - 401: { success: false, error: { code: 'UNAUTHORIZED', message } }
 * - 403: { success: false, error: { code: 'FORBIDDEN', message } }
 * - 404: { success: false, error: { code: 'NOT_FOUND', message } }
 * - 500: { success: false, error: { code, message } }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const auth = await getAuthContext();
    if (auth instanceof NextResponse) {
      return auth;
    }

    // Check permission - QA_INSPECTOR+ can start
    const permission = checkInspectorPermission(auth.roleCode);
    if (permission instanceof NextResponse) {
      return permission;
    }

    // Parse request body (optional)
    let takeOver = false;
    try {
      const body = await request.json();
      const validatedData = startInspectionSchema.parse(body);
      takeOver = validatedData.take_over;
    } catch {
      // Empty body is valid, use defaults
    }

    // Only QA_MANAGER+ can take over
    if (takeOver && !isAdminRole(auth.roleCode)) {
      return forbiddenResponse('Only QA Manager can take over inspections');
    }

    // Start inspection
    const inspection = await InspectionService.start(
      id,
      auth.userId,
      takeOver
    );

    return NextResponse.json({
      success: true,
      data: { inspection },
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/quality/inspections/:id/start');
  }
}
