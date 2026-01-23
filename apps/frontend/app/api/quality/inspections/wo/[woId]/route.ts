/**
 * WO Inspections API Route
 * Story: 06.10 - In-Process Inspection
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/inspections/wo/:woId - Get all inspections for a Work Order
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.10.in-process-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import * as InProcessInspectionService from '@/lib/services/in-process-inspection-service';

interface RouteParams {
  params: Promise<{ woId: string }>;
}

/**
 * GET /api/quality/inspections/wo/:woId
 * Get all inspections for a Work Order with quality summary
 *
 * Response:
 * - 200: { wo: {...}, inspections: [...], summary: {...} }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Work Order not found' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { woId } = await params;
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(woId)) {
      return NextResponse.json({ error: 'Invalid Work Order ID' }, { status: 400 });
    }

    // Get WO inspections
    const result = await InProcessInspectionService.getByWorkOrder(
      userData.org_id,
      woId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/quality/inspections/wo/:woId:', error);

    if (error instanceof InProcessInspectionService.NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
