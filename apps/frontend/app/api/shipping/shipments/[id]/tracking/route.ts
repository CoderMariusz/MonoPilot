/**
 * API Route: Get Shipment Tracking Info
 * Story: 07.14 - Shipment Manifest & Ship
 *
 * GET /api/shipping/shipments/:id/tracking - Get tracking info with timeline and carrier URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'
import { ShipmentManifestService } from '@/lib/services/shipment-manifest-service'

/**
 * GET /api/shipping/shipments/:id/tracking
 * Return complete tracking information including timeline and carrier URL
 *
 * AC-15 to AC-16: Tracking endpoint returns timeline and carrier URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shipmentId } = await params

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Verify shipment belongs to user's org (any authenticated user can view tracking)
    const { data: shipment } = await supabase
      .from('shipments')
      .select('id, org_id')
      .eq('id', shipmentId)
      .eq('org_id', orgId)
      .single()

    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Shipment not found',
          },
        },
        { status: 404 }
      )
    }

    // Call service
    const result = await ShipmentManifestService.getTrackingInfo(shipmentId)

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND'
          ? 404
          : result.error?.code === 'FORBIDDEN'
            ? 403
            : 500

      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Error in GET /api/shipping/shipments/:id/tracking:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    )
  }
}
