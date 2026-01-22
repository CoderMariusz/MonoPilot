/**
 * Parameters API Routes
 * Story: 06.4 - Test Parameters
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/specifications/:specId/parameters - List parameters
 * - POST /api/quality/specifications/:specId/parameters - Create parameter
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.4.test-parameters.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createParameterSchema, isValidUUID } from '@/lib/validation/spec-parameter-schema';
import { ZodError } from 'zod';
import * as SpecParameterService from '@/lib/services/spec-parameter-service';
import { NotFoundError, ValidationError, DatabaseError } from '@/lib/services/specification-service';

interface RouteContext {
  params: Promise<{ specId: string }>;
}

/**
 * GET /api/quality/specifications/:specId/parameters
 * List all parameters for a specification
 *
 * Response:
 * - 200: { parameters: [], spec: {} }
 * - 400: { error: 'Invalid specification ID' }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Specification not found' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest, context: RouteContext) {
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

    // Get specification info
    const { data: spec, error: specError } = await supabase
      .from('quality_specifications')
      .select('id, spec_number, name, status')
      .eq('id', specId)
      .single();

    if (specError || !spec) {
      return NextResponse.json(
        { error: 'Specification not found' },
        { status: 404 }
      );
    }

    // Get parameters
    const parameters = await SpecParameterService.getBySpecId(specId);

    return NextResponse.json({
      parameters,
      spec: {
        id: spec.id,
        spec_number: spec.spec_number,
        name: spec.name,
        status: spec.status,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/quality/specifications/:specId/parameters:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quality/specifications/:specId/parameters
 * Create new parameter for a specification
 *
 * Request Body: CreateParameterRequest
 *
 * Response:
 * - 201: { parameter: {} }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Specification not found' }
 * - 500: { error: string }
 */
export async function POST(request: NextRequest, context: RouteContext) {
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
    const validatedData = createParameterSchema.parse(body);

    // Create parameter
    const parameter = await SpecParameterService.create(
      specId,
      validatedData,
      session.user.id
    );

    return NextResponse.json({ parameter }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quality/specifications/:specId/parameters:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
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
