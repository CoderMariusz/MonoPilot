/**
 * Specifications API Routes
 * Story: 06.3 - Product Specifications
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/specifications - List specifications with filters
 * - POST /api/quality/specifications - Create new draft specification
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.3.product-specifications.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  createSpecificationSchema,
  specificationListQuerySchema,
} from '@/lib/validation/specification-schemas';
import { ZodError } from 'zod';
import * as SpecificationService from '@/lib/services/specification-service';

/**
 * GET /api/quality/specifications
 * List specifications with filters and pagination
 *
 * Query params: status, product_id, search, page, limit, sort_by, sort_order
 *
 * Response:
 * - 200: { specifications: [], pagination: {} }
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
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || undefined,
      product_id: searchParams.get('product_id') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: searchParams.get('sort_order') || 'desc',
    };

    const validatedParams = specificationListQuerySchema.parse(queryParams);

    // Get specifications
    const result = await SpecificationService.list(validatedParams);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/quality/specifications:', error);

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
 * POST /api/quality/specifications
 * Create new draft specification
 *
 * Request Body: CreateSpecificationInput
 *
 * Response:
 * - 201: { specification: {} }
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
    const validatedData = createSpecificationSchema.parse(body);

    // Create specification
    const specification = await SpecificationService.create(validatedData);

    return NextResponse.json({ specification }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quality/specifications:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
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
