/**
 * API Route: POST /api/planning/work-orders/:id/reschedule
 * Story 03.15: WO Gantt Chart View - Reschedule WO
 *
 * Reschedule a work order (drag-and-drop)
 */

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { rescheduleWO } from '@/lib/services/gantt-service';
import { rescheduleWOSchema } from '@/lib/validation/gantt-schemas';
import { handleApiError, successResponse } from '@/lib/api/error-handler';
import { getAuthContextWithRole, RoleSets } from '@/lib/api/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication and permission
    await getAuthContextWithRole(supabase, RoleSets.WORK_ORDER_WRITE);

    // Get WO ID from params
    const { id: woId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = rescheduleWOSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Validation failed',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    // Reschedule work order
    const result = await rescheduleWO(supabase, woId, validation.data);

    return successResponse(result.data, {
      message: 'Work order rescheduled successfully',
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/planning/work-orders/:id/reschedule');
  }
}
