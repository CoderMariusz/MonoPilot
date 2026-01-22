/**
 * Sampling Records API Routes
 * Story: 06.7 - Sampling Plans (AQL)
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - POST /api/quality/sampling-records - Record a sample during inspection
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.7.sampling-plans-aql.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createSamplingRecordSchema } from '@/lib/validation/sampling-plan-schemas';
import { ZodError } from 'zod';
import * as SamplingPlanService from '@/lib/services/sampling-plan-service';

/**
 * POST /api/quality/sampling-records
 * Record a sample during inspection
 *
 * Request Body: CreateSamplingRecordInput
 *
 * Response:
 * - 201: { sampling_record: {} }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createSamplingRecordSchema.parse(body);

    // Create sampling record
    const samplingRecord = await SamplingPlanService.createSamplingRecord(validatedData);

    return NextResponse.json({ sampling_record: samplingRecord }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quality/sampling-records:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof SamplingPlanService.ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
