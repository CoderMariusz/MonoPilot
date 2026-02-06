/**
 * API Route: Get Shipment Boxes
 * Story: 07.12 - Packing Scanner Mobile UI
 *
 * GET /api/shipping/scanner/pack/shipments/[id]/boxes - Get boxes for a shipment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'

// Roles that can view boxes
const ALLOWED_ROLES = ['packer', 'warehouse_packer', 'warehouse_manager', 'supervisor', 'warehouse', 'manager', 'admin', 'owner', 'super_admin']

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/shipping/scanner/pack/shipments/[id]/boxes
 * Returns boxes for a shipment
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId, userRole } = authContext

    // Check role permission
    if (!ALLOWED_ROLES.includes(userRole.toLowerCase())) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const shipmentId = params.id

    // Query boxes for shipment
    const { data: boxes, error } = await supabase
      .from('shipment_boxes')
      .select('*')
      .eq('shipment_id', shipmentId)
      .eq('org_id', orgId)
      .order('box_number', { ascending: true })

    if (error) {
      console.error('Error fetching boxes:', error)
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to load boxes' } },
        { status: 500 }
      )
    }

    // Format boxes
    const formattedBoxes = (boxes || []).map((box) => ({
      id: box.id,
      boxNumber: box.box_number,
      status: box.status,
      weight: box.weight,
      length: box.length,
      width: box.width,
      height: box.height,
    }))

    return NextResponse.json({ data: formattedBoxes })
  } catch (error) {
    console.error('Error in GET /api/shipping/scanner/pack/shipments/[id]/boxes:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
