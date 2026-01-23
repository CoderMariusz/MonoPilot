/**
 * Sampling Plan Detail API Routes
 * Story: 06.7 - Sampling Plans (AQL)
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/sampling-plans/:id - Get sampling plan detail
 * - PUT /api/quality/sampling-plans/:id - Update sampling plan
 * - DELETE /api/quality/sampling-plans/:id - Soft delete (deactivate) sampling plan
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.7.sampling-plans-aql.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { updateSamplingPlanSchema } from '@/lib/validation/sampling-plan-schemas';
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/quality/sampling-plans/:id
 * Get sampling plan detail
 *
 * Response:
 * - 200: { sampling_plan: {} }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Sampling plan not found' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    // Get sampling plan
    const result = await SamplingPlanService.getSamplingPlanById(id);

    if (!result) {
      return NextResponse.json({ error: 'Sampling plan not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/quality/sampling-plans/:id:', error);
    return handleServiceError(error);
  }
}

/**
 * PUT /api/quality/sampling-plans/:id
 * Update sampling plan
 *
 * Request Body: UpdateSamplingPlanInput
 *
 * Response:
 * - 200: { sampling_plan: {} }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Sampling plan not found' }
 * - 500: { error: string }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateSamplingPlanSchema.parse(body);

    // Update sampling plan
    const samplingPlan = await SamplingPlanService.updateSamplingPlan(id, validatedData);

    return NextResponse.json({ sampling_plan: samplingPlan });
  } catch (error) {
    console.error('Error in PUT /api/quality/sampling-plans/:id:', error);
    return handleServiceError(error);
  }
}

/**
 * DELETE /api/quality/sampling-plans/:id
 * Soft delete (deactivate) sampling plan
 *
 * Response:
 * - 200: { success: true, message: string, warning?: string }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Sampling plan not found' }
 * - 500: { error: string }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const authResult = await checkAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    // Delete (deactivate) sampling plan
    const result = await SamplingPlanService.deleteSamplingPlan(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in DELETE /api/quality/sampling-plans/:id:', error);
    return handleServiceError(error);
  }
}
