/**
 * API Route: Ship Shipment
 * Story: 07.14 - Shipment Manifest & Ship
 *
 * POST /api/shipping/shipments/:id/ship - IRREVERSIBLE: Consume inventory and update SO cascade
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'
import { ShipmentManifestService } from '@/lib/services/shipment-manifest-service'
import { shipShipmentSchema } from '@/lib/validation/manifest-schemas'

// Roles that can ship shipments
const ALLOWED_ROLES = ['warehouse', 'warehouse_manager', 'manager', 'admin', 'owner', 'super_admin']

/**
 * POST /api/shipping/shipments/:id/ship
 * Confirm shipment as shipped - IRREVERSIBLE action
 *
 * AC-4 to AC-11: Ship validates, consumes LPs, updates SO cascade
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

    const { userId, orgId, userRole } = authContext

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

    // Parse and validate request body
    let body: { confirm?: boolean } = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is allowed, will be validated by schema
    }

    const parseResult = shipShipmentSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIRMATION_REQUIRED',
            message: 'Ship action requires explicit confirmation (confirm=true)',
          },
        },
        { status: 400 }
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

    // Get user info for tracking
    const { data: userData } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single()

    const user = {
      id: userId,
      org_id: orgId,
      role: userRole,
      name: userData?.name || 'Unknown User',
    }

    // Call service
    const result = await ShipmentManifestService.shipShipment(shipmentId, body.confirm, user)

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND'
          ? 404
          : result.error?.code === 'FORBIDDEN'
            ? 403
            : result.error?.code === 'TRANSACTION_FAILED'
              ? 409
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
    console.error('Error in POST /api/shipping/shipments/:id/ship:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    )
  }
}
