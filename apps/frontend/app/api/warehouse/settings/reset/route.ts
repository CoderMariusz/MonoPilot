/**
 * Warehouse Settings Reset API Route
 * Story: 05.0 - Warehouse Settings (Module Configuration)
 * Phase: P3 (GREEN - Backend Implementation)
 *
 * Route:
 * - POST /api/warehouse/settings/reset - Reset settings to defaults
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/05-warehouse/05.0.warehouse-settings.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import WarehouseSettingsService from '@/lib/services/warehouse-settings-service';

/**
 * POST /api/warehouse/settings/reset
 * Reset warehouse settings to default values
 *
 * Response:
 * - 200: { settings: WarehouseSettings, message: string }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Forbidden' }
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

    // Get current user role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role_id, roles(code)')
      .eq('id', session.user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Authorization: ADMIN, WH_MANAGER only
    const roleCode = (currentUser.roles as any)?.code?.toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN', 'WH_MANAGER'].includes(roleCode)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Warehouse Manager role required' },
        { status: 403 }
      );
    }

    // Reset to defaults
    const settings = await WarehouseSettingsService.reset();

    return NextResponse.json({
      settings,
      message: 'Warehouse settings reset to defaults successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/warehouse/settings/reset:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
