/**
 * Reorder Parameters API Route
 * Story: 06.4 - Test Parameters
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - PATCH /api/quality/specifications/:specId/parameters/reorder - Reorder parameters
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.4.test-parameters.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { reorderParametersSchema, isValidUUID } from '@/lib/validation/spec-parameter-schema';
import { ZodError } from 'zod';
import * as SpecParameterService from '@/lib/services/spec-parameter-service';
import { NotFoundError, ValidationError, DatabaseError } from '@/lib/services/specification-service';

interface RouteContext {
  params: Promise<{ specId: string }>;
}

/**
 * PATCH /api/quality/specifications/:specId/parameters/reorder
 * Reorder parameters by specifying new order of IDs
 *
 * Request Body: { parameter_ids: string[] }
 *
 * Response:
 * - 200: { updated_count: number, parameters: [] }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Specification not found' }
 * - 500: { error: string }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const { specId } = await context.params;

    // Validate UUID format
    if (!isValidUUID(specId)) {
      return NextResponse.json(
        { error: 'Invalid specification ID format' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = reorderParametersSchema.parse(body);

    // Reorder parameters
    const parameters = await SpecParameterService.reorder(
      specId,
      validatedData.parameter_ids
    );

    return NextResponse.json({
      updated_count: validatedData.parameter_ids.length,
      parameters,
    });
  } catch (error) {
    console.error('Error in PATCH /api/quality/specifications/:specId/parameters/reorder:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
