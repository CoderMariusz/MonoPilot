/**
 * Quality Test Results API Routes
 * Story: 06.6 - Test Results Recording
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/test-results - Query test results with filters
 * - POST /api/quality/test-results - Create test result(s) (single or batch)
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.6.test-results-recording.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  testResultCreateSchema,
  testResultBatchCreateSchema,
  testResultQuerySchema,
} from '@/lib/validation/quality-test-results-schema';
import * as TestResultsService from '@/lib/services/test-results-service';
import { ZodError } from 'zod';

/**
 * GET /api/quality/test-results
 * Query test results with filters and pagination
 *
 * Query params: inspection_id, parameter_id, result_status, tested_by,
 *               from_date, to_date, page, limit
 *
 * Response:
 * - 200: { results: [], total: number, page: number, limit: number }
 * - 400: { error: string }
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
      inspection_id: searchParams.get('inspection_id') || undefined,
      parameter_id: searchParams.get('parameter_id') || undefined,
      result_status: searchParams.get('result_status') || undefined,
      tested_by: searchParams.get('tested_by') || undefined,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    const validatedParams = testResultQuerySchema.parse(queryParams);

    // Enforce max limit
    if (validatedParams.limit > 100) {
      validatedParams.limit = 100;
    }

    // Get results
    const data = await TestResultsService.query(validatedParams);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/quality/test-results:', error);

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
 * POST /api/quality/test-results
 * Create test result(s) - single or batch
 *
 * Request Body:
 * - Single: { inspection_id, parameter_id, measured_value, ... }
 * - Batch: { inspection_id, results: [...] }
 *
 * Response:
 * - 201: { result: {...} } or { results: [...] }
 * - 400: { error: string }
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

    const body = await request.json();

    // Check if batch or single
    if (body.results && Array.isArray(body.results)) {
      // Batch create
      const validated = testResultBatchCreateSchema.parse(body);
      const results = await TestResultsService.createBatch(validated, session.user.id);
      return NextResponse.json({ results }, { status: 201 });
    } else {
      // Single create
      const validated = testResultCreateSchema.parse(body);
      const result = await TestResultsService.create(validated, session.user.id);
      return NextResponse.json({ result }, { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/quality/test-results:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create test result' },
      { status: 400 }
    );
  }
}
