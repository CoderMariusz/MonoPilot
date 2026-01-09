/**
 * API Route: /api/v1/settings/warehouses/[warehouseId]/locations/[id]/move
 * Story: 01.9 - Warehouse Locations Management (Hierarchical)
 * Methods: POST (move location to new parent)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'
import { moveLocation } from '@/lib/services/location-service'
import { z } from 'zod'

// Validation schema for move request
const moveLocationSchema = z.object({
  new_parent_id: z.string().uuid().nullable(),
})

/**
 * POST /api/v1/settings/warehouses/:warehouseId/locations/:id/move
 * Move location to a new parent
 *
 * Request Body:
 * - new_parent_id: UUID of new parent location (null for root)
 *
 * Permission: OWNER, ADMIN, WAREHOUSE_MANAGER
 */
export async function POST(
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
    const { new_parent_id } = moveLocationSchema.parse(body)

    // Move location
    const result = await moveLocation(id, new_parent_id, userId, orgId)

    if (!result.success) {
      // Determine appropriate status code
      const status = result.error?.includes('not found') ? 404 :
                     result.error?.includes('circular') ||
                     result.error?.includes('hierarchy') ||
                     result.error?.includes('descendant') ? 400 : 500

      return NextResponse.json(
        { error: result.error || 'Failed to move location' },
        { status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/v1/settings/warehouses/:warehouseId/locations/:id/move:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
