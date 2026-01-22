/**
 * Sampling Records by Inspection API Routes
 * Story: 06.7 - Sampling Plans (AQL)
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/sampling-records/inspection/:inspectionId - List samples for inspection
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.7.sampling-plans-aql.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import * as SamplingPlanService from '@/lib/services/sampling-plan-service';

interface RouteParams {
  params: Promise<{ inspectionId: string }>;
}

/**
 * GET /api/quality/sampling-records/inspection/:inspectionId
 * List samples for an inspection
 *
 * Response:
 * - 200: { sampling_records: [], total_samples: number, required_samples: number }
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabase();
    const { inspectionId } = await params;

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sampling records for inspection
    const result = await SamplingPlanService.getSamplingRecordsForInspection(inspectionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/quality/sampling-records/inspection/:inspectionId:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
