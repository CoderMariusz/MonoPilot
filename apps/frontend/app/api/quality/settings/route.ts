/**
 * Quality Settings API Routes
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/settings - Get quality settings
 * - PUT /api/quality/settings - Update quality settings (partial update)
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.0.quality-settings.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { updateQualitySettingsSchema } from '@/lib/validation/quality-settings';
import { ZodError } from 'zod';
import * as QualitySettingsService from '@/lib/services/quality-settings-service';

/**
 * GET /api/quality/settings
 * Get quality settings for current organization
 * Auto-initializes with defaults if settings don't exist
 *
 * Response:
 * - 200: { settings: QualitySettings }
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

    // Get quality settings (auto-initializes if missing)
    const settings = await QualitySettingsService.get();

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error in GET /api/quality/settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quality/settings
 * Update quality settings (partial update)
 *
 * Request Body: UpdateQualitySettingsInput (partial fields)
 *
 * Response:
 * - 200: { settings: QualitySettings, message: string }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Forbidden' }
 * - 500: { error: string }
 */
export async function PUT(request: NextRequest) {
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

    // Authorization: ADMIN, OWNER, QUALITY_MANAGER only
    const roleCode = (currentUser.roles as any)?.code?.toLowerCase();
    if (!QualitySettingsService.canUpdateQualitySettings(roleCode)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin, Owner, or Quality Manager role required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateQualitySettingsSchema.parse(body);

    // Update settings
    const settings = await QualitySettingsService.update(validatedData);

    return NextResponse.json({
      settings,
      message: 'Quality settings updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/quality/settings:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
