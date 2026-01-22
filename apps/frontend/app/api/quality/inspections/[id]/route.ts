/**
 * Quality Inspection Detail API Routes
 * Story: 06.5 - Incoming Inspection
 * Phase: P4 - Refactoring (GREEN)
 *
 * Routes:
 * - GET /api/quality/inspections/:id - Get inspection detail with test results
 * - PUT /api/quality/inspections/:id - Update scheduled inspection
 * - DELETE /api/quality/inspections/:id - Delete scheduled inspection
 *
 * Refactored to use auth-middleware and error-handler utilities
 * to reduce code duplication across API routes.
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.5.incoming-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateInspectionSchema } from '@/lib/validation/inspection';
import * as InspectionService from '@/lib/services/inspection-service';
import { getAuthContext, checkAdminPermission } from '@/lib/api/auth-middleware';
import { handleApiError, forbiddenResponse } from '@/lib/api/error-handler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/quality/inspections/:id
 * Get inspection detail with test results
 *
 * Response:
 * - 200: { success: true, data: { inspection, test_results, test_result_summary, can_complete, suggested_result } }
 * - 401: { success: false, error: { code: 'UNAUTHORIZED', message } }
 * - 404: { success: false, error: { code: 'NOT_FOUND', message } }
 * - 500: { success: false, error: { code, message } }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const auth = await getAuthContext();
    if (auth instanceof NextResponse) {
      return auth;
    }

    // Get inspection detail
    const result = await InspectionService.getById(id);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Inspection not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/quality/inspections/:id');
  }
}

/**
 * PUT /api/quality/inspections/:id
 * Update scheduled inspection
 *
 * Request Body: UpdateInspectionInput
 *
 * Response:
 * - 200: { success: true, data: { inspection } }
 * - 400: { success: false, error: { code, message, details } }
 * - 401: { success: false, error: { code: 'UNAUTHORIZED', message } }
 * - 403: { success: false, error: { code: 'FORBIDDEN', message } }
 * - 404: { success: false, error: { code: 'NOT_FOUND', message } }
 * - 500: { success: false, error: { code, message } }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const auth = await getAuthContext();
    if (auth instanceof NextResponse) {
      return auth;
    }

    // Check permission - VIEWER cannot update
    if (auth.roleCode === 'viewer') {
      return forbiddenResponse('Insufficient permissions to update inspections');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateInspectionSchema.parse(body);

    // Update inspection
    const inspection = await InspectionService.update(id, validatedData);

    return NextResponse.json({
      success: true,
      data: { inspection },
    });
  } catch (error) {
    return handleApiError(error, 'PUT /api/quality/inspections/:id');
  }
}

/**
 * DELETE /api/quality/inspections/:id
 * Delete scheduled inspection
 *
 * Response:
 * - 204: No content
 * - 400: { success: false, error: { code: 'VALIDATION_ERROR', message } }
 * - 401: { success: false, error: { code: 'UNAUTHORIZED', message } }
 * - 403: { success: false, error: { code: 'FORBIDDEN', message } }
 * - 404: { success: false, error: { code: 'NOT_FOUND', message } }
 * - 500: { success: false, error: { code, message } }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const auth = await getAuthContext();
    if (auth instanceof NextResponse) {
      return auth;
    }

    // Check permission - only QA_MANAGER+ can delete
    const permission = checkAdminPermission(auth.roleCode);
    if (permission instanceof NextResponse) {
      return permission;
    }

    // Delete inspection
    await InspectionService.deleteInspection(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/quality/inspections/:id');
  }
}
