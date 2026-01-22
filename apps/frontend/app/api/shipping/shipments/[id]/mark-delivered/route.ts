/**
 * API Route: Mark Shipment Delivered
 * Story: 07.14 - Shipment Manifest & Ship
 *
 * POST /api/shipping/shipments/:id/mark-delivered - Mark shipment as delivered (Manager+ only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'
import { ShipmentManifestService } from '@/lib/services/shipment-manifest-service'

// Roles that can mark shipments as delivered (Manager+ only)
const ALLOWED_ROLES = ['manager', 'admin', 'owner', 'super_admin']

/**
 * POST /api/shipping/shipments/:id/mark-delivered
 * Mark shipment status as delivered
 *
 * AC-12 to AC-14: Mark Delivered endpoint (Manager+ only)
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

    // Check permission - Manager+ only
    const hasPermission = ALLOWED_ROLES.includes(userRole.toLowerCase())
    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Manager role required to mark shipment as delivered',
            user_role: userRole,
            required_roles: ['Manager', 'Admin'],
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
    const result = await ShipmentManifestService.markDelivered(shipmentId, user)

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND'
          ? 404
          : result.error?.code === 'INSUFFICIENT_PERMISSIONS'
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
    console.error('Error in POST /api/shipping/shipments/:id/mark-delivered:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    )
  }
}
