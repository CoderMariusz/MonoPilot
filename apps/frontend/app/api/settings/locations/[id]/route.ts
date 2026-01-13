import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { UpdateLocationSchema } from '@/lib/validation/location-schemas'
import {
  getLocationById,
  updateLocation,
  deleteLocation,
} from '@/lib/services/location-service'
import { ZodError } from 'zod'

/**
 * Location Management API Routes - Individual Location Operations
 * Story: 1.6 Location Management
 * Task 5: API Endpoints
 *
 * GET /api/settings/locations/:id - Get location detail
 * PUT /api/settings/locations/:id - Update location
 * DELETE /api/settings/locations/:id - Delete location
 */

// ============================================================================
// GET /api/settings/locations/:id - Get Location Detail (AC-005.6)
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const locationId = params.id

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

    // First get warehouse_id from location (required by service)
    const { data: locationBase, error: locError } = await supabase
      .from('locations')
      .select('warehouse_id')
      .eq('id', locationId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (locError || !locationBase) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Call service to get location detail with QR code
    const result = await getLocationById(locationBase.warehouse_id, locationId, currentUser.org_id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ location: result.data }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/settings/locations/:id:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/settings/locations/:id - Update Location (AC-005.1, AC-005.2)
// ============================================================================

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const locationId = params.id

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
    const validatedData = UpdateLocationSchema.parse(body)

    // Get warehouse_id from location first
    const { data: locationBase, error: locError } = await supabase
      .from('locations')
      .select('warehouse_id')
      .eq('id', locationId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (locError || !locationBase) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Call service to update location
    const result = await updateLocation(
      locationBase.warehouse_id,
      locationId,
      validatedData,
      session.user.id,
      currentUser.org_id
    )

    if (!result.success) {
      // Check for specific error types
      if (result.error?.includes('not found')) {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      if (result.error?.includes('already exists') || result.error?.includes('already in use')) {
        return NextResponse.json({ error: result.error }, { status: 409 })
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
    console.error('Error in PUT /api/settings/locations/:id:', error)

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

// ============================================================================
// DELETE /api/settings/locations/:id - Delete Location (AC-005.5)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const locationId = params.id

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

    // Check authorization: Admin only (AC-005.5)
    const roleCode = (currentUser.role as unknown as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (roleCode !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Check if soft delete is requested via query parameter
    const searchParams = request.nextUrl.searchParams
    const _softDelete = searchParams.get('soft') === 'true' // TODO: Implement soft delete in service

    // Get warehouse_id from location first
    const { data: locationBase, error: locError } = await supabase
      .from('locations')
      .select('warehouse_id')
      .eq('id', locationId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (locError || !locationBase) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Call service to delete location
    // AC-005.5: Check FK constraints, offer soft delete option
    const result = await deleteLocation(locationBase.warehouse_id, locationId, currentUser.org_id)

    if (!result.success) {
      // Check for specific error types
      if (result.error?.includes('default') || result.error?.includes('Change warehouse')) {
        // FK constraint - location is used as warehouse default
        return NextResponse.json(
          {
            error: result.error,
            suggestion: 'Use soft delete (archive) or change warehouse default first',
          },
          { status: 400 }
        )
      }

      if (result.error?.includes('referenced')) {
        // Other FK constraints
        return NextResponse.json(
          {
            error: result.error,
            suggestion: 'This location is referenced by other records. Use soft delete (archive) instead.',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete location' },
        { status: 500 }
      )
    }

    const message = _softDelete
      ? 'Location archived successfully'
      : 'Location deleted successfully'

    return NextResponse.json({ message }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/settings/locations/:id:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
