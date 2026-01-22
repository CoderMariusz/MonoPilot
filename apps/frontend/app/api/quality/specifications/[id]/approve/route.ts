/**
 * Specification Approve API Route
 * Story: 06.3 - Product Specifications
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - POST /api/quality/specifications/:id/approve - Approve and activate specification
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.3.product-specifications.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { approveSpecificationSchema } from '@/lib/validation/specification-schemas';
import { ZodError } from 'zod';
import * as SpecificationService from '@/lib/services/specification-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Roles that can approve specifications
const APPROVE_ROLES = ['admin', 'owner', 'qa_manager', 'quality_manager'];

/**
 * POST /api/quality/specifications/:id/approve
 * Approve and activate specification
 * Requires QA_MANAGER role or higher
 *
 * Request Body (optional): { approval_notes?: string }
 *
 * Response:
 * - 200: { specification: {}, superseded_specs: [] }
 * - 400: { error: 'Only draft specifications can be approved' }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Forbidden: QA Manager role required' }
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

    // Get current user role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role_id, roles(code)')
      .eq('id', session.user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Authorization: QA_MANAGER or higher required
    const roleCode = (currentUser.roles as any)?.code?.toLowerCase();
    if (!APPROVE_ROLES.includes(roleCode)) {
      return NextResponse.json(
        { error: 'Forbidden: QA Manager role required' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Parse and validate request body (optional)
    let approvalNotes: string | undefined;
    try {
      const body = await request.json();
      const validatedData = approveSpecificationSchema.parse(body);
      approvalNotes = validatedData.approval_notes;
    } catch {
      // Body is optional, continue without notes
    }

    // Approve specification
    const result = await SpecificationService.approve(
      id,
      session.user.id,
      approvalNotes
    );

    return NextResponse.json({
      specification: result.spec,
      superseded_specs: result.superseded,
    });
  } catch (error) {
    console.error('Error in POST /api/quality/specifications/:id/approve:', error);

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
