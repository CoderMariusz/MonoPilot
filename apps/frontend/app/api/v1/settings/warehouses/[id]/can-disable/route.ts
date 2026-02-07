/**
 * API Route: /api/v1/settings/warehouses/[id]/can-disable
 * Story: 01.8 - Warehouses CRUD
 * Method: GET
 *
 * Checks if a warehouse can be disabled
 * Returns allowed status and reason if not allowed
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'

/**
 * GET /api/v1/settings/warehouses/:id/can-disable
 * Check if warehouse can be disabled
 *
 * Returns:
 * - allowed: boolean - whether disable is allowed
 * - reason: string (optional) - explanation if not allowed
 *
 * Blocking conditions:
 * - Warehouse is default
 * - Warehouse has active inventory (LPs with qty > 0)
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

    // Check if warehouse exists
    const { data: warehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('id, code, is_default, is_active')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Already disabled
    if (!warehouse.is_active) {
      return NextResponse.json({
        allowed: false,
        reason: 'Warehouse is already disabled',
      })
    }

    // Check if is default warehouse
    if (warehouse.is_default) {
      return NextResponse.json({
        allowed: false,
        reason: 'Cannot disable default warehouse. Set another warehouse as default first.',
      })
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
      return NextResponse.json({
        allowed: false,
        reason: 'Warehouse has active inventory. Move or consume inventory before disabling.',
      })
    }

    // All checks passed - can disable
    return NextResponse.json({
      allowed: true,
    })
  } catch (error) {
    console.error('Error in GET /api/v1/settings/warehouses/:id/can-disable:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
