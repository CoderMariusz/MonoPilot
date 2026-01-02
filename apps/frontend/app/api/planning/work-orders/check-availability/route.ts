/**
 * API Route: POST /api/planning/work-orders/check-availability
 * Story 03.15: WO Gantt Chart View - Pre-drop validation
 *
 * Check line availability before dropping a WO in a new time slot
 */

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { checkLineAvailability } from '@/lib/services/gantt-service';
import { checkAvailabilitySchema } from '@/lib/validation/gantt-schemas';
import { handleApiError, successResponse } from '@/lib/api/error-handler';
import { getAuthContextWithRole, RoleSets } from '@/lib/api/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication and permission
    await getAuthContextWithRole(supabase, RoleSets.WORK_ORDER_WRITE);

    // Parse and validate request body
    const body = await request.json();
    const validation = checkAvailabilitySchema.safeParse(body);

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

    // Check availability
    const result = await checkLineAvailability(supabase, validation.data);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error, 'POST /api/planning/work-orders/check-availability');
  }
}
