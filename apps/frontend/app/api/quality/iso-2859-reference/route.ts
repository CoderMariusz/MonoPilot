/**
 * ISO 2859 Reference API Routes
 * Story: 06.7 - Sampling Plans (AQL)
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/iso-2859-reference - Get ISO 2859 sample size reference table
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.7.sampling-plans-aql.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { iso2859QuerySchema } from '@/lib/validation/sampling-plan-schemas';
import { ZodError } from 'zod';
import * as SamplingPlanService from '@/lib/services/sampling-plan-service';

/**
 * GET /api/quality/iso-2859-reference
 * Get ISO 2859 sample size reference table
 *
 * Query params: lot_size, inspection_level
 *
 * Response:
 * - 200: { reference_table: ISO2859Entry[] }
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
      lot_size: searchParams.get('lot_size') || undefined,
      inspection_level: searchParams.get('inspection_level') || undefined,
    };

    const validatedParams = iso2859QuerySchema.parse(queryParams);

    // Get ISO 2859 reference
    const referenceTable = await SamplingPlanService.getISO2859Reference(
      validatedParams.lot_size,
      validatedParams.inspection_level
    );

    return NextResponse.json({ reference_table: referenceTable });
  } catch (error) {
    console.error('Error in GET /api/quality/iso-2859-reference:', error);

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
