/**
 * Quality Test Results Individual API Routes
 * Story: 06.6 - Test Results Recording
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - PUT /api/quality/test-results/:id - Update test result
 * - DELETE /api/quality/test-results/:id - Delete test result
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.6.test-results-recording.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { testResultUpdateSchema } from '@/lib/validation/quality-test-results-schema';
import * as TestResultsService from '@/lib/services/test-results-service';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/quality/test-results/:id
 * Update test result
 *
 * Request Body: { measured_value?, notes?, equipment_id?, calibration_date?, attachment_url? }
 *
 * Response:
 * - 200: { result: {...} }
 * - 400: { error: string }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Not found' }
 * - 500: { error: string }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const validated = testResultUpdateSchema.parse({ ...body, id });

    const result = await TestResultsService.update(id, validated);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error in PUT /api/quality/test-results/:id:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to update test result';

    // Check for not found
    if (errorMessage.includes('not found') || errorMessage.includes('No rows')) {
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

/**
 * DELETE /api/quality/test-results/:id
 * Delete test result
 *
 * Response:
 * - 200: { success: true }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Not found' }
 * - 500: { error: string }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    await TestResultsService.deleteResult(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/quality/test-results/:id:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to delete test result';

    // Check for not found
    if (errorMessage.includes('not found') || errorMessage.includes('No rows')) {
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
