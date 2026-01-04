/**
 * Warehouse Settings API Routes
 * Story: 05.0 - Warehouse Settings (Module Configuration)
 * Phase: P3 (GREEN - Backend Implementation)
 *
 * Routes:
 * - GET /api/warehouse/settings - Get warehouse settings
 * - PUT /api/warehouse/settings - Update warehouse settings (full replace)
 * - PATCH /api/warehouse/settings - Partial update warehouse settings
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/05-warehouse/05.0.warehouse-settings.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  warehouseSettingsSchema,
  updateWarehouseSettingsSchema,
} from '@/lib/validation/warehouse-settings';
import { ZodError } from 'zod';
import WarehouseSettingsService from '@/lib/services/warehouse-settings-service';

/**
 * GET /api/warehouse/settings
 * Get warehouse settings for current organization
 * Auto-initializes with defaults if settings don't exist
 *
 * Response:
 * - 200: { settings: WarehouseSettings }
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

    // Get warehouse settings (auto-initializes if missing)
    const settings = await WarehouseSettingsService.get();

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error in GET /api/warehouse/settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/warehouse/settings
 * Update warehouse settings (full replace)
 *
 * Request Body: UpdateWarehouseSettingsInput (all fields)
 *
 * Response:
 * - 200: { settings: WarehouseSettings, message: string }
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

    // Authorization: ADMIN, WH_MANAGER only
    const roleCode = (currentUser.roles as any)?.code?.toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN', 'WH_MANAGER'].includes(roleCode)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Warehouse Manager role required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = warehouseSettingsSchema.parse(body);

    // Update settings
    const settings = await WarehouseSettingsService.update(validatedData);

    return NextResponse.json({
      settings,
      message: 'Warehouse settings updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/warehouse/settings:', error);

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

/**
 * PATCH /api/warehouse/settings
 * Partial update warehouse settings
 *
 * Request Body: Partial<UpdateWarehouseSettingsInput>
 *
 * Response:
 * - 200: { settings: WarehouseSettings, message: string }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Forbidden' }
 * - 500: { error: string }
 */
export async function PATCH(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateWarehouseSettingsSchema.parse(body);

    // Partial update
    const settings = await WarehouseSettingsService.partialUpdate(validatedData);

    return NextResponse.json({
      settings,
      message: 'Warehouse settings updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/warehouse/settings:', error);

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
