/**
 * Quality Inspections API Routes
 * Story: 06.5 - Incoming Inspection / Story: 06.10 - In-Process Inspection
 * Phase: P4 - Refactoring (GREEN)
 *
 * Routes:
 * - GET /api/quality/inspections - List inspections with filters
 * - POST /api/quality/inspections - Create new inspection (incoming or in-process)
 *
 * Supports both incoming and in-process inspection types.
 * In-process inspections require wo_id and wo_operation_id.
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.5.incoming-inspection.md}
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.10.in-process-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  createInspectionSchema,
  inspectionListQuerySchema,
} from '@/lib/validation/inspection';
import { createInProcessInspectionSchema } from '@/lib/validation/in-process-inspection';
import * as InspectionService from '@/lib/services/inspection-service';
import * as InProcessInspectionService from '@/lib/services/in-process-inspection-service';
import { getAuthContext, checkAdminPermission } from '@/lib/api/auth-middleware';
import { handleApiError, forbiddenResponse } from '@/lib/api/error-handler';

/**
 * GET /api/quality/inspections
 * List inspections with filters and pagination
 *
 * Query params: inspection_type, status, priority, inspector_id, product_id,
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
      inspection_type: searchParams.get('inspection_type') || undefined,
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

    // Check limit
    if (validatedParams.limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      );
    }

    // Get inspections
    const result = await InspectionService.list(validatedParams);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/quality/inspections:', error);

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

/**
 * POST /api/quality/inspections
 * Create new inspection
 *
 * Request Body: CreateInspectionInput
 *
 * Response:
 * - 201: { success: true, data: { inspection: {} } }
 * - 400: { success: false, error: { code, message, details } }
 * - 401: { success: false, error: { code: 'UNAUTHORIZED', message } }
 * - 403: { success: false, error: { code: 'FORBIDDEN', message } }
 * - 409: { success: false, error: { code: 'CONFLICT', message }, warning: true, existing_inspection_id }
 * - 500: { success: false, error: { code, message } }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = await getAuthContext();
    if (auth instanceof NextResponse) {
      return auth;
    }

    // Check permission - must not be VIEWER
    if (auth.roleCode === 'viewer') {
      return forbiddenResponse('Insufficient permissions to create inspections');
    }

    // Parse request body
    const body = await request.json();

    // Check if this is an in-process inspection (has wo_id and wo_operation_id)
    if (body.wo_id && body.wo_operation_id) {
      // Validate with in-process schema
      const validatedData = createInProcessInspectionSchema.parse(body);

      // Create in-process inspection
      const inspection = await InProcessInspectionService.createInProcess(
        auth.orgId,
        validatedData
      );

      return NextResponse.json(
        { success: true, data: { inspection } },
        { status: 201 }
      );
    }

    // Otherwise, validate as incoming inspection
    const validatedData = createInspectionSchema.parse(body);

    // Check if LP has active inspection (warning)
    if (validatedData.lp_id) {
      const hasActive = await InspectionService.hasActiveInspection(validatedData.lp_id);
      if (hasActive.has) {
        // Return 409 with warning - client can choose to proceed
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: `LP already has a pending inspection (${hasActive.inspectionNumber})`,
            },
            warning: true,
            existing_inspection_id: hasActive.inspectionId,
            existing_inspection_number: hasActive.inspectionNumber,
          },
          { status: 409 }
        );
      }
    }

    // Create incoming inspection
    const inspection = await InspectionService.create(validatedData);

    return NextResponse.json(
      { success: true, data: { inspection } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/quality/inspections');
  }
}
