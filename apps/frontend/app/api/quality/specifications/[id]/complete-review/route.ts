/**
 * Specification Complete Review API Route
 * Story: 06.3 - Product Specifications
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - POST /api/quality/specifications/:id/complete-review - Mark review as completed
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.3.product-specifications.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { completeReviewSchema } from '@/lib/validation/specification-schemas';
import { ZodError } from 'zod';
import * as SpecificationService from '@/lib/services/specification-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/quality/specifications/:id/complete-review
 * Mark specification review as completed
 * Updates last_review_date and recalculates next_review_date
 *
 * Request Body (optional): { review_notes?: string }
 *
 * Response:
 * - 200: { specification: {}, previous_review_date: string?, next_review_date: string }
 * - 400: { error: 'Only active specifications can be reviewed' }
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

    const { id } = await context.params;

    // Parse and validate request body (optional)
    let reviewNotes: string | undefined;
    try {
      const body = await request.json();
      const validatedData = completeReviewSchema.parse(body);
      reviewNotes = validatedData.review_notes;
    } catch {
      // Body is optional, continue without notes
    }

    // Get previous review date for response
    const existing = await SpecificationService.getById(id);
    const previousReviewDate = existing?.specification.last_review_date || null;

    // Complete review
    const specification = await SpecificationService.completeReview(
      id,
      session.user.id,
      reviewNotes
    );

    return NextResponse.json({
      specification,
      previous_review_date: previousReviewDate,
      next_review_date: specification.next_review_date,
    });
  } catch (error) {
    console.error(
      'Error in POST /api/quality/specifications/:id/complete-review:',
      error
    );

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
