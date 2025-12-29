/**
 * API Route: /api/v1/settings/warehouses/[id]/enable
 * Story: 01.8 - Warehouses CRUD
 * Method: PATCH
 *
 * Enables a previously disabled warehouse
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

/**
 * PATCH /api/v1/settings/warehouses/:id/enable
 * Enable previously disabled warehouse
 *
 * Clears disabled_at and disabled_by fields
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

    // Check if already enabled
    if (existingWarehouse.is_active) {
      return NextResponse.json(
        { error: 'Warehouse is already active' },
        { status: 400 }
      )
    }

    // Enable warehouse
    const { data: warehouse, error: updateError } = await supabase
      .from('warehouses')
      .update({
        is_active: true,
        disabled_at: null,
        disabled_by: null,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to enable warehouse:', updateError)
      return NextResponse.json(
        { error: 'Failed to enable warehouse' },
        { status: 500 }
      )
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error('Error in PATCH /api/v1/settings/warehouses/:id/enable:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
