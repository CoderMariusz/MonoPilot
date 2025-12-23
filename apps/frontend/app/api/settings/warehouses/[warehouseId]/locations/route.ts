import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createLocationSchema, locationListParamsSchema } from '@/lib/validation/location-schemas'
import { list, create } from '@/lib/services/location-service'
import { ZodError } from 'zod'

/**
 * Locations List API
 * Story: 01.9 - Warehouse Locations Management
 *
 * GET /api/settings/warehouses/[warehouseId]/locations - List locations
 * POST /api/settings/warehouses/[warehouseId]/locations - Create location
 */

// =============================================================================
// GET - List locations (tree or flat view)
// =============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ warehouseId: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const { warehouseId } = params

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      view: searchParams.get('view') || 'tree',
      level: searchParams.get('level') || undefined,
      type: searchParams.get('type') || undefined,
      parent_id: searchParams.get('parent_id') || undefined,
      search: searchParams.get('search') || undefined,
      include_capacity: searchParams.get('include_capacity') === 'true',
    }

    // Validate params
    const validatedParams = locationListParamsSchema.parse(queryParams)

    // Call service
    const result = await list(warehouseId, validatedParams)

    if (!result.success) {
      if (result.code === 'WAREHOUSE_NOT_FOUND') {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      if (result.code === 'UNAUTHORIZED') {
        return NextResponse.json({ error: result.error }, { status: 401 })
      }

      return NextResponse.json(
        { error: result.error || 'Failed to fetch locations' },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/settings/warehouses/[warehouseId]/locations:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =============================================================================
// POST - Create location
// =============================================================================

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ warehouseId: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const { warehouseId } = params

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check authorization: SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const allowedRoles = ['super_admin', 'admin', 'warehouse_manager']
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createLocationSchema.parse(body)

    // Call service
    const result = await create(warehouseId, validatedData)

    if (!result.success) {
      if (result.code === 'DUPLICATE_CODE') {
        return NextResponse.json({ error: result.error }, { status: 409 })
      }

      if (result.code === 'INVALID_HIERARCHY') {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      if (result.code === 'WAREHOUSE_NOT_FOUND') {
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
    console.error('Error in POST /api/settings/warehouses/[warehouseId]/locations:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
