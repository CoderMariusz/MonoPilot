/**
 * API Route: Start Packing
 * Story: 07.14 - Shipment Status Transitions
 *
 * POST /api/shipping/shipments/:id/start-packing
 * Transition: pending -> packing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'

const ALLOWED_ROLES = ['warehouse', 'warehouse_manager', 'manager', 'admin', 'owner', 'super_admin']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const { id: shipmentId } = await params
    const supabase = await createServerSupabase()

    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId, userRole, userId } = authContext

    // Check permission
    if (!ALLOWED_ROLES.includes(userRole.toLowerCase())) {
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

    // Get shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, status, org_id, shipment_number')
      .eq('id', shipmentId)
      .eq('org_id', orgId)
      .single()

    if (shipmentError || !shipment) {
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

    // Validate status transition
    if (shipment.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Shipment must be in 'pending' status to start packing. Current status: ${shipment.status}`,
            current_status: shipment.status,
            allowed_statuses: ['pending'],
          },
        },
        { status: 400 }
      )
    }

    const packingStartedAt = new Date().toISOString()

    // Update shipment status to "packing"
    const { error: updateError } = await supabase
      .from('shipments')
      .update({
        status: 'packing',
        packing_started_at: packingStartedAt,
        packing_started_by: userId,
      })
      .eq('id', shipmentId)

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update shipment status',
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: shipmentId,
        shipment_number: shipment.shipment_number,
        status: 'packing',
        packing_started_at: packingStartedAt,
      },
    })
  } catch (error) {
    console.error('Error starting packing:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    )
  }
}
