/**
 * Single Parameter API Routes
 * Story: 06.4 - Test Parameters
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - PUT /api/quality/specifications/:specId/parameters/:id - Update parameter
 * - DELETE /api/quality/specifications/:specId/parameters/:id - Delete parameter
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.4.test-parameters.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { updateParameterSchema, isValidUUID } from '@/lib/validation/spec-parameter-schema';
import { ZodError } from 'zod';
import * as SpecParameterService from '@/lib/services/spec-parameter-service';
import { NotFoundError, ValidationError, DatabaseError } from '@/lib/services/specification-service';

interface RouteContext {
  params: Promise<{ id: string; parameterId: string }>;
}

/**
 * PUT /api/quality/specifications/:specId/parameters/:id
 * Update a parameter
 *
 * Request Body: UpdateParameterRequest (partial)
 *
 * Response:
 * - 200: { parameter: {} }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Parameter not found' }
 * - 500: { error: string }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
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

    const { id: specId, parameterId } = await context.params;

    // Validate UUID formats
    if (!isValidUUID(specId)) {
      return NextResponse.json(
        { error: 'Invalid specification ID format' },
        { status: 400 }
      );
    }
    if (!isValidUUID(parameterId)) {
      return NextResponse.json(
        { error: 'Invalid parameter ID format' },
        { status: 400 }
      );
    }

    // Verify spec exists
    const { data: spec, error: specError } = await supabase
      .from('quality_specifications')
      .select('id, status')
      .eq('id', specId)
      .single();

    if (specError || !spec) {
      return NextResponse.json(
        { error: 'Specification not found' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateParameterSchema.parse(body);

    // Update parameter
    const parameter = await SpecParameterService.update(
      parameterId,
      validatedData,
      session.user.id
    );

    return NextResponse.json({ parameter });
  } catch (error) {
    console.error('Error in PUT /api/quality/specifications/:specId/parameters/:id:', error);

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

/**
 * DELETE /api/quality/specifications/:specId/parameters/:id
 * Delete a parameter (only draft specs allowed via RLS)
 *
 * Response:
 * - 204: No Content
 * - 400: { error: 'Invalid ID format' }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Cannot delete parameters on non-draft specs' }
 * - 404: { error: 'Parameter not found' }
 * - 500: { error: string }
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { id: specId, parameterId } = await context.params;

    // Validate UUID formats
    if (!isValidUUID(specId)) {
      return NextResponse.json(
        { error: 'Invalid specification ID format' },
        { status: 400 }
      );
    }
    if (!isValidUUID(parameterId)) {
      return NextResponse.json(
        { error: 'Invalid parameter ID format' },
        { status: 400 }
      );
    }

    // Verify spec exists
    const { data: spec, error: specError } = await supabase
      .from('quality_specifications')
      .select('id, status')
      .eq('id', specId)
      .single();

    if (specError || !spec) {
      return NextResponse.json(
        { error: 'Specification not found' },
        { status: 400 }
      );
    }

    // RLS policy will enforce draft-only deletion
    // But we can provide a better error message
    if (spec.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot delete parameters on non-draft specifications' },
        { status: 403 }
      );
    }

    // Delete parameter
    await SpecParameterService.deleteParameter(parameterId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/quality/specifications/:specId/parameters/:id:', error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof DatabaseError) {
      // RLS policy blocks deletion on non-draft specs
      if (error.message.includes('policy')) {
        return NextResponse.json(
          { error: 'Cannot delete parameters on non-draft specifications' },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
