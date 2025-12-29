/**
 * API Route: /api/v1/settings/warehouses/[id]/set-default
 * Story: 01.8 - Warehouses CRUD
 * Method: PATCH
 *
 * Sets warehouse as default (atomic operation)
 * Previous default is automatically unset via database trigger
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

/**
 * PATCH /api/v1/settings/warehouses/:id/set-default
 * Set warehouse as default
 *
 * The database trigger ensure_single_default_warehouse() handles
 * atomically unsetting the previous default warehouse.
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

    // Check if warehouse exists and is active
    const { data: existingWarehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('id, is_active')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Cannot set disabled warehouse as default
    if (!existingWarehouse.is_active) {
      return NextResponse.json(
        { error: 'Cannot set disabled warehouse as default', code: 'WAREHOUSE_DISABLED' },
        { status: 400 }
      )
    }

    // Set as default (trigger handles unsetting previous default)
    const { data: warehouse, error: updateError } = await supabase
      .from('warehouses')
      .update({
        is_default: true,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to set default warehouse:', updateError)
      return NextResponse.json(
        { error: 'Failed to set default warehouse' },
        { status: 500 }
      )
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error('Error in PATCH /api/v1/settings/warehouses/:id/set-default:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
