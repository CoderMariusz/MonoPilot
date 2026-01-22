/**
 * Quality Test Results Inspection Summary API Routes
 * Story: 06.6 - Test Results Recording
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/test-results/inspection/:id/summary - Get summary stats
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.6.test-results-recording.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import * as TestResultsService from '@/lib/services/test-results-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/quality/test-results/inspection/:id/summary
 * Get test result summary for inspection (pass/fail/marginal counts)
 *
 * Response:
 * - 200: { summary: { total, pass, fail, marginal, pass_rate } }
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabase();
    const { id } = await params;

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await TestResultsService.getInspectionSummary(id);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in GET /api/quality/test-results/inspection/:id/summary:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch summary' },
      { status: 400 }
    );
  }
}
