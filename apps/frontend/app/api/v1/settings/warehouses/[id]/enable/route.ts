/**
 * API Route: /api/v1/settings/warehouses/[id]/enable
 * Story: 01.8 - Warehouses CRUD
 * Method: PATCH (enable)
 *
 * Enable previously disabled warehouse
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * PATCH /api/v1/settings/warehouses/:id/enable
 * Enable warehouse
 *
 * AC-07: Enable warehouse
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
    const userRole = (userData.role as any)?.code

    // Check role permissions
    if (!['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(userRole)) {
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

    // Enable warehouse
    const { data: warehouse, error: updateError } = await supabase
      .from('warehouses')
      .update({
        is_active: true,
        disabled_at: null,
        disabled_by: null,
        updated_by: user.id,
      })
      .eq('id', params.id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to enable warehouse:', updateError)
      return NextResponse.json({ error: 'Failed to enable warehouse' }, { status: 500 })
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error('Error in PATCH /api/v1/settings/warehouses/:id/enable:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
