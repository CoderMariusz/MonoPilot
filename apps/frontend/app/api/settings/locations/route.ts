import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  CreateLocationSchema,
  LocationFiltersSchema,
} from '@/lib/validation/location-schemas'
import { createLocation, getLocations } from '@/lib/services/location-service'
import { ZodError } from 'zod'

/**
 * Location Management API Routes
 * Story: 1.6 Location Management
 * Task 5: API Endpoints
 *
 * GET /api/settings/locations - List locations with filters
 * POST /api/settings/locations - Create new location
 */

// ============================================================================
// GET /api/settings/locations - List Locations (AC-005.4)
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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const warehouse_id = searchParams.get('warehouse_id')
    const type = searchParams.get('type')
    const is_active = searchParams.get('is_active')
    const search = searchParams.get('search')

    // Validate filters
    const filters = LocationFiltersSchema.parse({
      type: type || undefined,
      search: search || undefined,
    })

    // Call service to get locations (warehouseId required, default to first warehouse if not specified)
    let warehouseId = warehouse_id || ''
    if (!warehouseId) {
      // Get the first warehouse for the org if not specified
      const { data: warehouse } = await supabase
        .from('warehouses')
        .select('id')
        .eq('org_id', currentUser.org_id)
        .limit(1)
        .single()
      if (warehouse) {
        warehouseId = warehouse.id
      }
    }
    const result = await getLocations(warehouseId, filters, currentUser.org_id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch locations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ locations: result.data || [] }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/settings/locations:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/settings/locations - Create Location (AC-005.1, AC-005.2, AC-005.3)
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Get current user to check role and org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization: Admin only (AC-005.1)
    const roleCode = (currentUser.role as unknown as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (roleCode !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CreateLocationSchema.parse(body)

    // warehouse_id is required for creating a location
    if (!body.warehouse_id) {
      return NextResponse.json(
        { error: 'warehouse_id is required' },
        { status: 400 }
      )
    }

    // Call service to create location
    const result = await createLocation(
      body.warehouse_id,
      validatedData,
      session.user.id,
      currentUser.org_id
    )

    if (!result.success) {
      // Check for specific error types
      if (result.error?.includes('already exists')) {
        return NextResponse.json({ error: result.error }, { status: 409 })
      }

      if (result.error?.includes('not found')) {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      return NextResponse.json(
        { error: result.error || 'Failed to create location' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        location: result.data,
        message: 'Location created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/settings/locations:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
