/**
 * API Route: Manifest Shipment
 * Story: 07.14 - Shipment Manifest & Ship
 *
 * POST /api/shipping/shipments/:id/manifest - Validate SSCC and update status to manifested
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'
import { ShipmentManifestService } from '@/lib/services/shipment-manifest-service'

// Roles that can manifest shipments
const ALLOWED_ROLES = ['warehouse', 'warehouse_manager', 'manager', 'admin', 'owner', 'super_admin']

/**
 * POST /api/shipping/shipments/:id/manifest
 * Validate SSCC completeness and update shipment status to manifested
 *
 * AC-1 to AC-3: Manifest validates SSCC presence on all boxes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF protection
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const { id: shipmentId } = await params

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId, userRole } = authContext

    // Check permission
    const hasPermission = ALLOWED_ROLES.includes(userRole.toLowerCase())
    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions for this action',
          },
        },
        { status: 403 }
      )
    }

    // Verify shipment belongs to user's org
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
    const result = await ShipmentManifestService.manifestShipment(shipmentId)

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND'
          ? 404
          : result.error?.code === 'FORBIDDEN'
            ? 403
            : 400

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
    console.error('Error in POST /api/shipping/shipments/:id/manifest:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    )
  }
}
