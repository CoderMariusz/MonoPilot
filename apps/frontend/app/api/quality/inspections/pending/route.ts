/**
 * Pending Inspections API Route
 * Story: 06.5 - Incoming Inspection
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/inspections/pending - Get pending inspection queue
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.5.incoming-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import * as InspectionService from '@/lib/services/inspection-service';

/**
 * GET /api/quality/inspections/pending
 * Get pending inspections (scheduled + in_progress)
 *
 * Query params:
 * - type: 'incoming' | 'in_process' | 'final' (optional)
 *
 * Response:
 * - 200: { inspections: [], counts: { scheduled, in_progress, total } }
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

    // Get type filter if provided
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || undefined;

    // Get pending inspections
    const result = await InspectionService.getPendingInspections(type);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/quality/inspections/pending:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
