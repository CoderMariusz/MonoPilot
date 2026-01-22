/**
 * Specification Detail API Routes
 * Story: 06.3 - Product Specifications
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/specifications/:id - Get specification detail
 * - PUT /api/quality/specifications/:id - Update draft specification
 * - DELETE /api/quality/specifications/:id - Delete draft specification
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.3.product-specifications.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { updateSpecificationSchema } from '@/lib/validation/specification-schemas';
import { ZodError } from 'zod';
import * as SpecificationService from '@/lib/services/specification-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/quality/specifications/:id
 * Get specification detail with version history
 *
 * Response:
 * - 200: { specification: {}, version_history: [], parameters_count: number }
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

    const { id } = await context.params;

    // Get specification
    const result = await SpecificationService.getById(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Specification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/quality/specifications/:id:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quality/specifications/:id
 * Update draft specification
 *
 * Request Body: UpdateSpecificationInput (partial)
 *
 * Response:
 * - 200: { specification: {} }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Specification not found' }
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

    const { id } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateSpecificationSchema.parse(body);

    // Update specification
    const specification = await SpecificationService.update(id, validatedData);

    return NextResponse.json({ specification });
  } catch (error) {
    console.error('Error in PUT /api/quality/specifications/:id:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof SpecificationService.NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof SpecificationService.ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quality/specifications/:id
 * Delete draft specification (only draft status can be deleted)
 *
 * Response:
 * - 200: { message: 'Specification deleted' }
 * - 400: { error: 'Only draft specifications can be deleted' }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Specification not found' }
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

    const { id } = await context.params;

    // Delete specification
    await SpecificationService.deleteSpec(id);

    return NextResponse.json({ message: 'Specification deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/quality/specifications/:id:', error);

    if (error instanceof SpecificationService.NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof SpecificationService.ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
