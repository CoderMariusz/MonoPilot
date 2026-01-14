/**
 * API Route: /api/v1/settings/warehouses/[id]/locations
 * Story: 01.9 - Warehouse Locations Management (Hierarchical)
 * Methods: GET (list/tree), POST (create)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'
import { createLocationSchema, locationListParamsSchema } from '@/lib/validation/location-schemas'
import { createLocation, getLocations } from '@/lib/services/location-service'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/warehouses/:id/locations
 * List locations for warehouse (tree or flat view)
 *
 * Query Parameters:
 * - view: 'tree' (default) | 'flat'
 * - level: Filter by level (zone/aisle/rack/bin)
 * - type: Filter by location_type
 * - parent_id: Filter children of specific parent (null for root)
 * - search: Search by code or name
 * - include_capacity: Include capacity stats (boolean)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: warehouseId } = await params
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = {
      view: (searchParams.get('view') as 'tree' | 'flat') || 'tree',
      level: searchParams.get('level') as 'zone' | 'aisle' | 'rack' | 'bin' | undefined,
      type: searchParams.get('type') as 'bulk' | 'pallet' | 'shelf' | 'floor' | 'staging' | undefined,
      parent_id: searchParams.get('parent_id') || undefined,
      search: searchParams.get('search') || undefined,
      include_capacity: searchParams.get('include_capacity') === 'true',
    }

    // Validate filters
    try {
      locationListParamsSchema.parse(filters)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.errors },
          { status: 400 }
        )
      }
    }

    // Get locations
    const result = await getLocations(warehouseId, filters, orgId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch locations' },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/v1/settings/warehouses/:id/locations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/v1/settings/warehouses/:id/locations
 * Create new location
 *
 * Request Body: CreateLocationInput
 *
 * Permission: OWNER, ADMIN, WAREHOUSE_MANAGER
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF protection: validate request origin
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const { id: warehouseId } = await params
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
    const validatedData = createLocationSchema.parse(body)

    // Create location
    const result = await createLocation(warehouseId, validatedData, userId, orgId)

    if (!result.success) {
      // Determine appropriate status code
      const status = result.error?.includes('not found') ? 404 :
                     result.error?.includes('already exists') ? 409 :
                     result.error?.includes('must be') ? 400 : 500

      return NextResponse.json(
        { error: result.error || 'Failed to create location' },
        { status }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/v1/settings/warehouses/:id/locations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
