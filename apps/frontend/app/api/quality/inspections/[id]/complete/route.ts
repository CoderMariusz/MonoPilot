/**
 * Inspection Complete API Route
 * Story: 06.5 - Incoming Inspection
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - POST /api/quality/inspections/:id/complete - Complete inspection with result
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.5.incoming-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { completeInspectionSchema } from '@/lib/validation/inspection';
import { ZodError } from 'zod';
import * as InspectionService from '@/lib/services/inspection-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/quality/inspections/:id/complete
 * Complete inspection with result
 *
 * Request Body:
 * - result: 'pass' | 'fail' | 'conditional' (required)
 * - result_notes: string (optional)
 * - defects_found: number (default: 0)
 * - major_defects: number (default: 0)
 * - minor_defects: number (default: 0)
 * - critical_defects: number (default: 0)
 * - conditional_reason: string (required if result='conditional')
 * - conditional_restrictions: string (required if result='conditional')
 * - conditional_expires_at: string (optional ISO datetime)
 * - create_ncr: boolean (default: false)
 *
 * Response:
 * - 200: { inspection: {}, lp_status_updated: boolean, ncr_id?: string }
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

    // Check permission - QA_INSPECTOR or QA_MANAGER can complete
    const roleCode = (userData.roles as any)?.code?.toLowerCase();
    if (
      roleCode !== 'qa_inspector' &&
      roleCode !== 'qa_manager' &&
      roleCode !== 'admin' &&
      roleCode !== 'owner'
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions to complete inspections' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = completeInspectionSchema.parse(body);

    // Only QA_MANAGER can approve conditional
    if (
      validatedData.result === 'conditional' &&
      roleCode !== 'qa_manager' &&
      roleCode !== 'admin' &&
      roleCode !== 'owner'
    ) {
      return NextResponse.json(
        { error: 'Only QA Manager can approve conditional results' },
        { status: 403 }
      );
    }

    // Complete inspection
    const result = await InspectionService.complete(
      id,
      validatedData,
      session.user.id
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/quality/inspections/:id/complete:', error);

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
