import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getTree } from '@/lib/services/location-service'

/**
 * Location Tree API
 * Story: 01.9 - Warehouse Locations Management
 *
 * GET /api/settings/warehouses/[warehouseId]/locations/[id]/tree - Get subtree
 */

// =============================================================================
// GET - Get subtree under location
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
    const result = await getTree(warehouseId, id)

    if (!result.success) {
      if (result.code === 'LOCATION_NOT_FOUND') {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      if (result.code === 'WAREHOUSE_NOT_FOUND') {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      return NextResponse.json(
        { error: result.error || 'Failed to fetch location tree' },
        { status: 500 }
      )
    }

    return NextResponse.json({ locations: result.data }, { status: 200 })
  } catch (error) {
    console.error(
      'Error in GET /api/settings/warehouses/[warehouseId]/locations/[id]/tree:',
      error
    )
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
