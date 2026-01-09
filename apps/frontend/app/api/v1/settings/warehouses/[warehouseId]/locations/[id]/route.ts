/**
 * API Route: /api/v1/settings/warehouses/[warehouseId]/locations/[id]
 * Story: 01.9 - Warehouse Locations Management (Hierarchical)
 * Methods: GET (getById), PUT (update), DELETE (delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'
import { updateLocationSchema } from '@/lib/validation/location-schemas'
import { getLocationById, updateLocation, deleteLocation } from '@/lib/services/location-service'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/warehouses/:warehouseId/locations/:id
 * Get single location by ID
 *
 * Returns 404 for cross-org access (not 403) - security best practice
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string; id: string }> }
) {
  try {
    const { warehouseId, id } = await params
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Get location
    const result = await getLocationById(warehouseId, id, orgId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Location not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/v1/settings/warehouses/:warehouseId/locations/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/v1/settings/warehouses/:warehouseId/locations/:id
 * Update location
 *
 * Request Body: UpdateLocationInput
 * Note: code, level, parent_id are immutable
 *
 * Permission: OWNER, ADMIN, WAREHOUSE_MANAGER
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string; id: string }> }
) {
  try {
    // CSRF protection: validate request origin
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const { warehouseId, id } = await params
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Check role permissions
    const allowedRoles = ['owner', 'admin', 'warehouse_manager']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return permissionError
    }

    const { userId, orgId } = authContext

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateLocationSchema.parse(body)

    // Update location
    const result = await updateLocation(warehouseId, id, validatedData, userId, orgId)

    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 : 500

      return NextResponse.json(
        { error: result.error || 'Failed to update location' },
        { status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/v1/settings/warehouses/:warehouseId/locations/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/settings/warehouses/:warehouseId/locations/:id
 * Delete location
 *
 * Blocked if location has children or inventory
 *
 * Permission: OWNER, ADMIN only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string; id: string }> }
) {
  try {
    const { warehouseId, id } = await params
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Check role permissions - ADMIN+ only for delete
    const allowedRoles = ['owner', 'admin']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return permissionError
    }

    const { orgId } = authContext

    // Delete location
    const result = await deleteLocation(warehouseId, id, orgId)

    if (!result.success) {
      // Determine appropriate status code
      const status = result.error?.includes('not found') ? 404 :
                     result.error?.includes('children') ||
                     result.error?.includes('inventory') ||
                     result.error?.includes('referenced') ? 400 : 500

      return NextResponse.json(
        { error: result.error || 'Failed to delete location' },
        { status }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/v1/settings/warehouses/:warehouseId/locations/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
