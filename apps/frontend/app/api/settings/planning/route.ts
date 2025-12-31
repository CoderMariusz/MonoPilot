/**
 * Planning Settings API Routes
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * GET /api/settings/planning - Fetch settings (auth required, any role)
 * PATCH /api/settings/planning - Update settings (auth + admin/owner required)
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/03-planning/context/03.17/api.yaml}
 */

import { NextResponse } from 'next/server';
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server';
import { getPlanningSettings, updatePlanningSettings } from '@/lib/services/planning-settings-service';
import { planningSettingsUpdateSchema } from '@/lib/validation/planning-settings-schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/planning
 * Get planning settings for current org (auto-initialize if missing)
 *
 * @returns 200 with PlanningSettings object
 * @returns 401 if not authenticated
 * @returns 500 on server error
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Get current session
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get planning settings (auto-initializes if missing)
    const settings = await getPlanningSettings(userData.org_id);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch planning settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch planning settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings/planning
 * Update planning settings for current org (admin/owner required)
 *
 * @returns 200 with success message and updated settings
 * @returns 400 if validation fails
 * @returns 401 if not authenticated
 * @returns 403 if insufficient permissions
 * @returns 500 on server error
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabase();

    // Get current session
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org_id and role using admin client to bypass RLS
    const supabaseAdmin = createServerSupabaseAdmin();
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check admin permission
    const roleData = userData.role as { code?: string } | null;
    const roleCode = (
      typeof roleData === 'string'
        ? roleData
        : Array.isArray(roleData)
          ? (roleData as Array<{ code?: string }>)[0]?.code
          : roleData?.code
    )?.toLowerCase();

    const allowedRoles = ['owner', 'admin'];
    if (!roleCode || !allowedRoles.includes(roleCode)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();

    const parseResult = planningSettingsUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    // Update settings
    const settings = await updatePlanningSettings(userData.org_id, parseResult.data);

    return NextResponse.json({
      success: true,
      message: 'Planning settings saved successfully',
      settings,
    });
  } catch (error) {
    console.error('Failed to update planning settings:', error);
    return NextResponse.json(
      { error: 'Failed to update planning settings' },
      { status: 500 }
    );
  }
}
