/**
 * API Route: /api/v1/settings/warehouses/[id]/disable
 * Story: 01.8 - Warehouses CRUD
 * Method: PATCH
 *
 * Disables warehouse with business rule validation:
 * - Cannot disable if has active inventory (LPs with qty > 0)
 * - Cannot disable if is default warehouse
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

/**
 * PATCH /api/v1/settings/warehouses/:id/disable
 * Disable warehouse
 *
 * Business Rules:
 * - Cannot disable if has active inventory (license plates with qty > 0)
 * - Cannot disable if is the default warehouse
 *
 * Permission: SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF protection: validate request origin
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const { id } = await params
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Check role permissions
    const allowedRoles = ['owner', 'admin', 'warehouse_manager']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return permissionError
    }

    const { userId, orgId } = authContext

    // Check if warehouse exists
    const { data: existingWarehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('id, is_default, is_active')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check if already disabled
    if (!existingWarehouse.is_active) {
      return NextResponse.json(
        { error: 'Warehouse is already disabled' },
        { status: 400 }
      )
    }

    // Check if is default warehouse
    if (existingWarehouse.is_default) {
      return NextResponse.json(
        {
          error: 'Cannot disable default warehouse. Set another warehouse as default first.',
          code: 'CANNOT_DISABLE_DEFAULT',
        },
        { status: 400 }
      )
    }

    // Check for active inventory (license plates with qty > 0)
    const { data: activeLPs, error: lpError } = await supabase
      .from('license_plates')
      .select('id')
      .eq('warehouse_id', id)
      .gt('quantity', 0)
      .limit(1)

    // If table exists and has active LPs, block disable
    if (!lpError && activeLPs && activeLPs.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot disable warehouse with active inventory',
          code: 'HAS_ACTIVE_INVENTORY',
        },
        { status: 400 }
      )
    }

    // Disable warehouse
    const { data: warehouse, error: updateError } = await supabase
      .from('warehouses')
      .update({
        is_active: false,
        disabled_at: new Date().toISOString(),
        disabled_by: userId,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to disable warehouse:', updateError)
      return NextResponse.json(
        { error: 'Failed to disable warehouse' },
        { status: 500 }
      )
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error('Error in PATCH /api/v1/settings/warehouses/:id/disable:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
