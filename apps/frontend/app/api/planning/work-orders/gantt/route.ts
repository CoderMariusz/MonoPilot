/**
 * API Route: GET /api/planning/work-orders/gantt
 * Story 03.15: WO Gantt Chart View - Fetch Gantt data
 *
 * Returns aggregated Gantt chart data with swimlanes and WO bars
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getGanttData } from '@/lib/services/gantt-service';
import { getGanttDataSchema, getDefaultDateRange } from '@/lib/validation/gantt-schemas';
import { handleApiError, successResponse } from '@/lib/api/error-handler';
import { getAuthContextOrThrow } from '@/lib/api/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    await getAuthContextOrThrow(supabase);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const defaults = getDefaultDateRange();

    const params = {
      view_by: searchParams.get('view_by') || 'line',
      from_date: searchParams.get('from_date') || defaults.from_date,
      to_date: searchParams.get('to_date') || defaults.to_date,
      status: searchParams.getAll('status[]').length > 0
        ? searchParams.getAll('status[]')
        : undefined,
      line_id: searchParams.get('line_id') || undefined,
      product_id: searchParams.get('product_id') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Validate parameters
    const validation = getGanttDataSchema.safeParse(params);
    if (!validation.success) {
      const errors = validation.error.errors;
      const isDateRangeError = errors.some(e =>
        e.message.includes('from_date must be before') ||
        e.message.includes('Date range cannot exceed')
      );

      return NextResponse.json(
        {
          success: false,
          error: {
            code: isDateRangeError ? 'INVALID_DATE_RANGE' : 'VALIDATION_ERROR',
            message: errors[0]?.message || 'Validation failed',
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    // Fetch Gantt data
    const data = await getGanttData(supabase, validation.data);

    return successResponse(data);
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders/gantt');
  }
}
