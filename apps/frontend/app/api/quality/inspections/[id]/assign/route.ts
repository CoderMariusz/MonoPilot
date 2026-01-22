/**
 * Inspection Assignment API Route
 * Story: 06.5 - Incoming Inspection
 * Phase: P4 - Refactoring (GREEN)
 *
 * Routes:
 * - POST /api/quality/inspections/:id/assign - Assign inspector to inspection
 *
 * Refactored to use auth-middleware and error-handler utilities
 * to reduce code duplication across API routes.
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.5.incoming-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { assignInspectionSchema } from '@/lib/validation/inspection';
import * as InspectionService from '@/lib/services/inspection-service';
import { getAuthContext, checkAdminPermission } from '@/lib/api/auth-middleware';
import { handleApiError } from '@/lib/api/error-handler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/quality/inspections/:id/assign
 * Assign inspector to inspection
 *
 * Request Body:
 * - inspector_id: string (UUID)
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

    // Check permission - only QA_MANAGER+ can assign
    const permission = checkAdminPermission(auth.roleCode);
    if (permission instanceof NextResponse) {
      return permission;
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = assignInspectionSchema.parse(body);

    // Assign inspector
    const inspection = await InspectionService.assign(
      id,
      validatedData.inspector_id,
      auth.userId
    );

    return NextResponse.json({
      success: true,
      data: { inspection },
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/quality/inspections/:id/assign');
  }
}
