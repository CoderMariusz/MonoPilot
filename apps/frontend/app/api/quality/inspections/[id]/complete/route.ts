/**
 * Inspection Complete API Route
 * Story: 06.5 - Incoming Inspection / Story: 06.10 - In-Process Inspection
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - POST /api/quality/inspections/:id/complete - Complete inspection with result
 *
 * Supports both incoming and in-process inspection types.
 * For in-process inspections, also updates WO operation QA status.
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.5.incoming-inspection.md}
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.10.in-process-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { completeInspectionSchema } from '@/lib/validation/inspection';
import { completeInProcessInspectionSchema } from '@/lib/validation/in-process-inspection';
import { ZodError } from 'zod';
import * as InspectionService from '@/lib/services/inspection-service';
import * as InProcessInspectionService from '@/lib/services/in-process-inspection-service';

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

    // Get inspection to check type
    const { data: inspection } = await supabase
      .from('quality_inspections')
      .select('inspection_type, wo_operation_id')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single();

    // Complete inspection based on type
    let result;
    if (inspection?.inspection_type === 'in_process' && inspection?.wo_operation_id) {
      // Validate with in-process schema for additional fields
      const inProcessData = completeInProcessInspectionSchema.parse(body);
      result = await InProcessInspectionService.completeInProcess(
        userData.org_id,
        id,
        inProcessData,
        session.user.id
      );
    } else {
      // Use standard completion for incoming/final inspections
      result = await InspectionService.complete(
        id,
        validatedData,
        session.user.id
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/quality/inspections/:id/complete:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof InspectionService.NotFoundError ||
        error instanceof InProcessInspectionService.NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof InspectionService.ValidationError ||
        error instanceof InProcessInspectionService.ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
