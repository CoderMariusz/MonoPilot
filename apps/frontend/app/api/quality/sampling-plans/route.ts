/**
 * Sampling Plans API Routes
 * Story: 06.7 - Sampling Plans (AQL)
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/sampling-plans - List sampling plans with filters
 * - POST /api/quality/sampling-plans - Create new sampling plan
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.7.sampling-plans-aql.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  createSamplingPlanSchema,
  samplingPlansListQuerySchema,
} from '@/lib/validation/sampling-plan-schemas';
import { ZodError } from 'zod';
import * as SamplingPlanService from '@/lib/services/sampling-plan-service';

/**
 * Helper to check authentication
 */
async function checkAuth(): Promise<{ error?: NextResponse }> {
  const supabase = await createServerSupabase();
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (authError || !session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {};
}

/**
 * Helper to handle service errors
 */
function handleServiceError(error: unknown, defaultStatus = 500) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Invalid request data', details: error.errors },
      { status: 400 }
    );
  }

  if (error instanceof SamplingPlanService.ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof SamplingPlanService.NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Internal server error' },
    { status: defaultStatus }
  );
}

/**
 * GET /api/quality/sampling-plans
 * List sampling plans with filters and pagination
 *
 * Query params: page, page_size, inspection_type, is_active, include_inactive, search, sort_by, sort_order
 *
 * Response:
 * - 200: { sampling_plans: [], total: number, page: number, page_size: number }
 * - 401: { error: 'Unauthorized' }
 * - 400: { error: 'Invalid query parameters', details: ZodError[] }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if (authResult.error) {
      return authResult.error;
    }

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page') || '1',
      page_size: searchParams.get('page_size') || '20',
      inspection_type: searchParams.get('inspection_type') || undefined,
      is_active: searchParams.get('is_active') || undefined,
      include_inactive: searchParams.get('include_inactive') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: searchParams.get('sort_order') || 'desc',
    };

    const validatedParams = samplingPlansListQuerySchema.parse(queryParams);

    // Get sampling plans
    const result = await SamplingPlanService.getAllSamplingPlans(validatedParams);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/quality/sampling-plans:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return handleServiceError(error);
  }
}

/**
 * POST /api/quality/sampling-plans
 * Create new sampling plan
 *
 * Request Body: CreateSamplingPlanInput
 *
 * Response:
 * - 201: { sampling_plan: {} }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if (authResult.error) {
      return authResult.error;
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createSamplingPlanSchema.parse(body);

    // Create sampling plan
    const samplingPlan = await SamplingPlanService.createSamplingPlan(validatedData);

    return NextResponse.json({ sampling_plan: samplingPlan }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quality/sampling-plans:', error);
    return handleServiceError(error);
  }
}
