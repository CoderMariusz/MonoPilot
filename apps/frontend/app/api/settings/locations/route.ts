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
      warehouse_id: warehouse_id || undefined,
      type: type || undefined,
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      search: search || undefined,
    })

    // Call service to get locations
    const result = await getLocations(filters, currentUser.org_id)

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
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CreateLocationSchema.parse(body)

    // Call service to create location (add warehouse_id from body)
    const result = await createLocation(
      { ...validatedData, warehouse_id: body.warehouse_id } as Parameters<typeof createLocation>[0],
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
