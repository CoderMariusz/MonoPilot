/**
 * API Route: /api/v1/settings/warehouses/[warehouseId]/locations/[id]/tree
 * Story: 01.9 - Warehouse Locations Management (Hierarchical)
 * Methods: GET (get subtree under location)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'
import { getTree } from '@/lib/services/location-service'

/**
 * GET /api/v1/settings/warehouses/:warehouseId/locations/:id/tree
 * Get subtree under a specific location
 *
 * Returns the location and all its descendants in tree structure
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

    // Get subtree starting from the specified location
    const result = await getTree(warehouseId, orgId, id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch location tree' },
        { status: 500 }
      )
    }

    // If no locations found, return 404
    if (!result.data?.locations.length) {
      return NextResponse.json(
        { error: 'Location not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/v1/settings/warehouses/:warehouseId/locations/:id/tree:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
