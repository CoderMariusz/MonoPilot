/**
 * Inspection Cancel API Route
 * Story: 06.5 - Incoming Inspection
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - POST /api/quality/inspections/:id/cancel - Cancel scheduled inspection
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.5.incoming-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { cancelInspectionSchema } from '@/lib/validation/inspection';
import { ZodError } from 'zod';
import * as InspectionService from '@/lib/services/inspection-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/quality/inspections/:id/cancel
 * Cancel scheduled inspection
 *
 * Request Body:
 * - cancellation_reason: string (required, min 10 chars)
 *
 * Response:
 * - 200: { inspection: {} }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Forbidden' }
 * - 404: { error: 'Inspection not found' }
 * - 500: { error: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Get user's role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id, roles(code)')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permission - only QA_MANAGER can cancel
    const roleCode = (userData.roles as any)?.code?.toLowerCase();
    if (roleCode !== 'qa_manager' && roleCode !== 'admin' && roleCode !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions to cancel inspections' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = cancelInspectionSchema.parse(body);

    // Cancel inspection
    const inspection = await InspectionService.cancel(
      id,
      validatedData.cancellation_reason,
      session.user.id
    );

    return NextResponse.json({ inspection });
  } catch (error) {
    console.error('Error in POST /api/quality/inspections/:id/cancel:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof InspectionService.NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof InspectionService.ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
