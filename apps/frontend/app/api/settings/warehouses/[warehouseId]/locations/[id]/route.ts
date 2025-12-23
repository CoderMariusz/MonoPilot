import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateLocationSchema } from '@/lib/validation/location-schemas'
import { getById, update, deleteLocation } from '@/lib/services/location-service'
import { ZodError } from 'zod'

/**
 * Location By ID API
 * Story: 01.9 - Warehouse Locations Management
 *
 * GET /api/settings/warehouses/[warehouseId]/locations/[id] - Get location
 * PUT /api/settings/warehouses/[warehouseId]/locations/[id] - Update location
 * DELETE /api/settings/warehouses/[warehouseId]/locations/[id] - Delete location
 */

// =============================================================================
// GET - Get location by ID
// =============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ warehouseId: string; id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const { warehouseId, id } = params

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call service
    const result = await getById(warehouseId, id)

    if (!result.success) {
      if (result.code === 'LOCATION_NOT_FOUND') {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      return NextResponse.json(
        { error: result.error || 'Failed to fetch location' },
        { status: 500 }
      )
    }

    return NextResponse.json({ location: result.data }, { status: 200 })
  } catch (error) {
    console.error(
      'Error in GET /api/settings/warehouses/[warehouseId]/locations/[id]:',
      error
    )
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =============================================================================
// PUT - Update location
// =============================================================================

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ warehouseId: string; id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const { warehouseId, id } = params

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
    const validatedData = updateLocationSchema.parse(body)

    // Call service
    const result = await update(warehouseId, id, validatedData)

    if (!result.success) {
      if (result.code === 'LOCATION_NOT_FOUND') {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      return NextResponse.json(
        { error: result.error || 'Failed to update location' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        location: result.data,
        message: 'Location updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Error in PUT /api/settings/warehouses/[warehouseId]/locations/[id]:',
      error
    )

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =============================================================================
// DELETE - Delete location
// =============================================================================

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ warehouseId: string; id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const { warehouseId, id } = params

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check authorization: SUPER_ADMIN or ADMIN only
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const allowedRoles = ['super_admin', 'admin']
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Call service
    const result = await deleteLocation(warehouseId, id)

    if (!result.success) {
      if (result.code === 'HAS_CHILDREN') {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      if (result.code === 'HAS_INVENTORY') {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      if (result.code === 'LOCATION_NOT_FOUND') {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete location' },
        { status: 500 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(
      'Error in DELETE /api/settings/warehouses/[warehouseId]/locations/[id]:',
      error
    )
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
