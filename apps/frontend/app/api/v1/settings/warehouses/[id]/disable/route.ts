/**
 * API Route: /api/v1/settings/warehouses/[id]/disable
 * Story: 01.8 - Warehouses CRUD
 * Method: PATCH (disable)
 *
 * Disable warehouse with business rules validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * PATCH /api/v1/settings/warehouses/:id/disable
 * Disable warehouse
 *
 * AC-07: Disable warehouse (with business rules)
 * Business Rules:
 * - Cannot disable warehouse with active inventory
 * - Cannot disable default warehouse
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
      .select('id, is_default, is_active')
      .eq('id', params.id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingWarehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    // Business Rule: Cannot disable default warehouse
    if (existingWarehouse.is_default) {
      return NextResponse.json(
        { error: 'Cannot disable default warehouse. Set another warehouse as default first.' },
        { status: 400 }
      )
    }

    // Business Rule: Cannot disable warehouse with active inventory
    const { count: inventoryCount } = await supabase
      .from('license_plates')
      .select('*', { count: 'exact', head: true })
      .eq('warehouse_id', params.id)
      .gt('quantity', 0)

    if ((inventoryCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot disable warehouse with active inventory' },
        { status: 400 }
      )
    }

    // Disable warehouse
    const { data: warehouse, error: updateError } = await supabase
      .from('warehouses')
      .update({
        is_active: false,
        disabled_at: new Date().toISOString(),
        disabled_by: user.id,
        updated_by: user.id,
      })
      .eq('id', params.id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to disable warehouse:', updateError)
      return NextResponse.json({ error: 'Failed to disable warehouse' }, { status: 500 })
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error('Error in PATCH /api/v1/settings/warehouses/:id/disable:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
