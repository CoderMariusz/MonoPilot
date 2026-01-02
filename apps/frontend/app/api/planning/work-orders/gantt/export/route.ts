/**
 * API Route: GET /api/planning/work-orders/gantt/export
 * Story 03.15: WO Gantt Chart View - Export to PDF
 *
 * Export Gantt chart to PDF format
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { exportGanttPDF } from '@/lib/services/gantt-service';
import { exportGanttSchema } from '@/lib/validation/gantt-schemas';
import { handleApiError } from '@/lib/api/error-handler';
import { getAuthContextWithRole, RoleSets } from '@/lib/api/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication and permission
    await getAuthContextWithRole(supabase, RoleSets.WORK_ORDER_WRITE);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      format: searchParams.get('format') || 'pdf',
      from_date: searchParams.get('from_date'),
      to_date: searchParams.get('to_date'),
      view_by: searchParams.get('view_by') || 'line',
      status: searchParams.getAll('status[]').length > 0
        ? searchParams.getAll('status[]')
        : undefined,
    };

    // Validate parameters
    const validation = exportGanttSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
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

    // Generate PDF
    const pdfBlob = await exportGanttPDF(supabase, validation.data);

    // Generate filename with date
    const filename = `wo-gantt-schedule-${validation.data.from_date}-to-${validation.data.to_date}.pdf`;

    // Return PDF response
    const arrayBuffer = await pdfBlob.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(arrayBuffer.byteLength),
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders/gantt/export');
  }
}
