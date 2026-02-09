/**
 * API Route: Cancel Shipment
 * Story: 07.14 - Shipment Status Transitions
 *
 * POST /api/shipping/shipments/:id/cancel
 * Transition: pending, packing, packed -> cancelled
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'

const ALLOWED_ROLES = ['manager', 'admin', 'owner', 'super_admin']
const CANCELLABLE_STATUSES = ['pending', 'packing', 'packed']

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

    // Check permission - only managers and above can cancel
    if (!ALLOWED_ROLES.includes(userRole.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only managers can cancel shipments',
          },
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { cancel_reason } = body

    if (!cancel_reason) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_REASON',
            message: 'cancel_reason is required',
          },
        },
        { status: 400 }
      )
    }

    // Get shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, status, org_id, shipment_number, sales_order_id')
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

    // Validate status - can only cancel from certain statuses
    if (!CANCELLABLE_STATUSES.includes(shipment.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Shipment cannot be cancelled from '${shipment.status}' status`,
            current_status: shipment.status,
            allowed_statuses: CANCELLABLE_STATUSES,
          },
        },
        { status: 400 }
      )
    }

    const cancelledAt = new Date().toISOString()
    const previousStatus = shipment.status

    // Update shipment status to "cancelled"
    const { error: updateError } = await supabase
      .from('shipments')
      .update({
        status: 'cancelled',
        cancelled_at: cancelledAt,
        cancelled_by: userId,
        cancel_reason,
        previous_status: previousStatus,
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

    // Update sales order status back to "pending" if it's still in initial states
    if (shipment.sales_order_id) {
      await supabase
        .from('sales_orders')
        .update({ status: 'pending' })
        .eq('id', shipment.sales_order_id)
        .in('status', ['packing', 'packed']) // Only revert if in these states
    }

    return NextResponse.json({
      success: true,
      data: {
        id: shipmentId,
        shipment_number: shipment.shipment_number,
        status: 'cancelled',
        cancelled_at: cancelledAt,
        cancel_reason,
        previous_status: previousStatus,
      },
    })
  } catch (error) {
    console.error('Error cancelling shipment:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    )
  }
}
