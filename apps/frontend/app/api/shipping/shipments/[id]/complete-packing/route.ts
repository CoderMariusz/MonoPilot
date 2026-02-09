/**
 * API Route: Complete Packing
 * Story: 07.14 - Shipment Status Transitions
 *
 * POST /api/shipping/shipments/:id/complete-packing
 * Transition: packing -> packed
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
    if (shipment.status !== 'packing') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Shipment must be in 'packing' status to complete packing. Current status: ${shipment.status}`,
            current_status: shipment.status,
            allowed_statuses: ['packing'],
          },
        },
        { status: 400 }
      )
    }

    // Check if there are any boxes associated with this shipment
    const { data: boxes, error: boxesError } = await supabase
      .from('shipment_boxes')
      .select('id')
      .eq('shipment_id', shipmentId)

    if (boxesError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to validate boxes',
          },
        },
        { status: 500 }
      )
    }

    if (!boxes || boxes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_BOXES',
            message: 'Shipment must have at least one box to complete packing',
          },
        },
        { status: 400 }
      )
    }

    const packedAt = new Date().toISOString()

    // Update shipment status to "packed"
    const { error: updateError } = await supabase
      .from('shipments')
      .update({
        status: 'packed',
        packed_at: packedAt,
        packed_by: userId,
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
        status: 'packed',
        packed_at: packedAt,
        box_count: boxes.length,
      },
    })
  } catch (error) {
    console.error('Error completing packing:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    )
  }
}
