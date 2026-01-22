/**
 * Quality Test Results by Inspection API Routes
 * Story: 06.6 - Test Results Recording
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/test-results/inspection/:id - Get all results for inspection
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
 * GET /api/quality/test-results/inspection/:id
 * Get all test results for an inspection
 *
 * Response:
 * - 200: { results: [...] }
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

    const results = await TestResultsService.getByInspection(id);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in GET /api/quality/test-results/inspection/:id:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch test results' },
      { status: 400 }
    );
  }
}
