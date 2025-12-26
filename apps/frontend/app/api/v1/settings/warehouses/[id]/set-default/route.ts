/**
 * API Route: /api/v1/settings/warehouses/[id]/set-default
 * Story: 01.8 - Warehouses CRUD
 * Method: PATCH (set as default)
 *
 * Sets warehouse as default (atomic operation via trigger)
 * The ensure_single_default_warehouse trigger automatically unsets previous default
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * PATCH /api/v1/settings/warehouses/:id/set-default
 * Set warehouse as default warehouse
 *
 * AC-05: Set default warehouse (atomic operation)
 * Trigger ensures only one default per org
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const orgId = userData.org_id
    // Role can be object or array depending on Supabase query
    const roleData = userData.role as any
    const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code

    // Check role permissions - use lowercase role codes as stored in DB
    if (!['owner', 'admin', 'warehouse_manager'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check warehouse exists
    const { data: existingWarehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('id')
      .eq('id', params.id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingWarehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    // Set as default (trigger handles unsetting previous default atomically)
    const { data: warehouse, error: updateError } = await supabase
      .from('warehouses')
      .update({
        is_default: true,
        updated_by: user.id,
      })
      .eq('id', params.id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to set default warehouse:', updateError)
      return NextResponse.json({ error: 'Failed to set default warehouse' }, { status: 500 })
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error('Error in PATCH /api/v1/settings/warehouses/:id/set-default:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
