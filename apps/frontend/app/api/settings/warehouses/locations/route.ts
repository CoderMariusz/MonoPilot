import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getLocations } from '@/lib/services/location-service'

/**
 * Warehouse Locations API Routes
 * Epic: 01 - Settings Module
 * Story: P0 - Critical API endpoint for warehouse locations
 *
 * GET /api/settings/warehouses/locations - List all locations across warehouses
 */

// ============================================================================
// GET /api/settings/warehouses/locations - List Locations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') || 'tree'
    const warehouse_id = searchParams.get('warehouse_id')
    const is_active = searchParams.get('is_active')

    // If warehouse_id is not specified, return all locations across all warehouses
    if (!warehouse_id) {
      // Get all warehouses for the org
      const { data: warehouses, error: warehouseError } = await supabase
        .from('warehouses')
        .select('id, name, code')
        .eq('org_id', currentUser.org_id)
        .eq('is_active', true)

      if (warehouseError) {
        console.error('Failed to fetch warehouses:', warehouseError)
        return NextResponse.json(
          { error: 'Failed to fetch warehouses' },
          { status: 500 }
        )
      }

      if (!warehouses || warehouses.length === 0) {
        return NextResponse.json(
          { data: [] },
          { status: 200 }
        )
      }

      // Fetch locations from all warehouses
      const allLocations: unknown[] = []

      for (const warehouse of warehouses) {
        const result = await getLocations(
          warehouse.id,
          {
            view: view as 'tree' | 'flat',
            is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
            include_capacity: false,
          },
          currentUser.org_id
        )

        if (result.success && result.data) {
          // Add warehouse info to each location
          const locationsWithWarehouse = result.data.locations.map((loc) => ({
            ...loc,
            warehouse_id: warehouse.id,
            warehouse_name: warehouse.name,
            warehouse_code: warehouse.code,
          }))
          allLocations.push(...locationsWithWarehouse)
        }
      }

      return NextResponse.json(
        { data: allLocations },
        { status: 200 }
      )
    }

    // If warehouse_id is specified, fetch locations for that warehouse only
    const result = await getLocations(
      warehouse_id,
      {
        view: view as 'tree' | 'flat',
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
        include_capacity: false,
      },
      currentUser.org_id
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch locations' },
        { status: 500 }
      )
    }

    // Get warehouse info
    const { data: warehouse } = await supabase
      .from('warehouses')
      .select('id, name, code')
      .eq('id', warehouse_id)
      .eq('org_id', currentUser.org_id)
      .single()

    // Add warehouse info to each location
    const locationsWithWarehouse = result.data?.locations.map((loc) => ({
      ...loc,
      warehouse_id: warehouse?.id,
      warehouse_name: warehouse?.name,
      warehouse_code: warehouse?.code,
    })) || []

    return NextResponse.json(
      { data: locationsWithWarehouse },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/settings/warehouses/locations:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
