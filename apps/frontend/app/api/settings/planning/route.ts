/**
 * Planning Settings API Routes
 * Story: 03.5a - PO Approval Setup
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * GET /api/settings/planning - Fetch settings (auth required, any role)
 * PUT /api/settings/planning - Update settings (auth + admin/owner required)
 * PATCH /api/settings/planning - Update settings (auth + admin/owner required)
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/03-planning/03.5a.po-approval-setup.md}
 * @see {@link docs/2-MANAGEMENT/epics/current/03-planning/context/03.17/api.yaml}
 */

import { NextResponse } from 'next/server';
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server';
import { getPlanningSettings, updatePlanningSettings } from '@/lib/services/planning-settings-service';
import { planningSettingsUpdateSchema } from '@/lib/validation/planning-settings-schema';
import {
  handleApiError,
  successResponse,
  unauthorizedResponse,
  userNotFoundResponse,
  forbiddenResponse,
} from '@/lib/api/error-handler';

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
      return unauthorizedResponse();
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return userNotFoundResponse();
    }

    // Get planning settings (auto-initializes if missing)
    const settings = await getPlanningSettings(userData.org_id);

    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error, 'GET /api/settings/planning');
  }
}

/**
 * Helper function to handle settings update
 * Shared by PUT and PATCH handlers to eliminate code duplication
 */
async function handleUpdateSettings(request: Request) {
  const supabase = await createServerSupabase();

  // Get current session
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return unauthorizedResponse();
  }

  // Get user's org_id and role using admin client to bypass RLS
  const supabaseAdmin = createServerSupabaseAdmin();
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('org_id, role:roles(code)')
    .eq('id', session.user.id)
    .single();

  if (userError || !userData) {
    return userNotFoundResponse();
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
    return forbiddenResponse('You do not have permission to access settings');
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON',
          details: 'Request body must be valid JSON',
        },
      },
      { status: 400 }
    );
  }

  // Validate request body
  const parseResult = planningSettingsUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parseResult.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  // Update settings
  const settings = await updatePlanningSettings(userData.org_id, parseResult.data);

  // Use consistent response format
  return successResponse(settings, {
    message: 'Planning settings updated successfully',
  });
}

/**
 * PUT /api/settings/planning
 * Update planning settings for current org (admin/owner required)
 *
 * Story 03.5a expects PUT method with response format:
 * { success: boolean, data: PlanningSettings, message: string }
 *
 * @returns 200 with success message and updated settings
 * @returns 400 if validation fails
 * @returns 401 if not authenticated
 * @returns 403 if insufficient permissions
 * @returns 500 on server error
 */
export async function PUT(request: Request) {
  try {
    return await handleUpdateSettings(request);
  } catch (error) {
    return handleApiError(error, 'PUT /api/settings/planning');
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
    return await handleUpdateSettings(request);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/settings/planning');
  }
}
