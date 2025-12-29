/**
 * API Route: /api/v1/settings/warehouses/[id]/has-inventory
 * Story: 01.8 - Warehouses CRUD
 * Method: GET
 *
 * Check if warehouse has active inventory (license plates with qty > 0)
 * Used by client-side service to determine if warehouse can be disabled
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'

/**
 * GET /api/v1/settings/warehouses/:id/has-inventory
 * Check if warehouse has active inventory
 *
 * Returns: { hasInventory: boolean }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Verify warehouse exists and belongs to org
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (warehouseError || !warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check for active inventory (license plates with qty > 0)
    const { data: activeLPs, error: lpError } = await supabase
      .from('license_plates')
      .select('id')
      .eq('warehouse_id', id)
      .gt('quantity', 0)
      .limit(1)

    // If table doesn't exist or query fails, assume no inventory
    if (lpError) {
      return NextResponse.json({ hasInventory: false })
    }

    return NextResponse.json({
      hasInventory: activeLPs && activeLPs.length > 0,
    })
  } catch (error) {
    console.error('Error in GET /api/v1/settings/warehouses/:id/has-inventory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
