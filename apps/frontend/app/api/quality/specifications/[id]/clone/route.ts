/**
 * Specification Clone API Route
 * Story: 06.3 - Product Specifications
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - POST /api/quality/specifications/:id/clone - Clone as new version
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.3.product-specifications.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import * as SpecificationService from '@/lib/services/specification-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/quality/specifications/:id/clone
 * Clone specification as new version
 *
 * Response:
 * - 201: { specification: {} } - New draft version
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

    // Clone specification
    const specification = await SpecificationService.cloneAsNewVersion(
      id,
      session.user.id
    );

    return NextResponse.json({ specification }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quality/specifications/:id/clone:', error);

    if (error instanceof SpecificationService.NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
