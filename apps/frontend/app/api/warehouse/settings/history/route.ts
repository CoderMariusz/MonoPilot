/**
 * Warehouse Settings History API Route
 * Story: 05.0 - Warehouse Settings (Module Configuration)
 * Phase: P3 (GREEN - Backend Implementation)
 *
 * Route:
 * - GET /api/warehouse/settings/history - Get audit trail
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/05-warehouse/05.0.warehouse-settings.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import WarehouseSettingsService from '@/lib/services/warehouse-settings-service';

/**
 * GET /api/warehouse/settings/history
 * Get warehouse settings change history (audit trail)
 *
 * Query Parameters:
 * - limit: number (default: 50) - Number of records to return
 *
 * Response:
 * - 200: { history: WarehouseSettingsAudit[] }
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

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 500) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (must be 1-500)' },
        { status: 400 }
      );
    }

    // Get audit trail
    const history = await WarehouseSettingsService.getHistory(limit);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error in GET /api/warehouse/settings/history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
