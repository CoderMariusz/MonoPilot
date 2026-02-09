/**
 * API Route: Mark Shipment as Exception
 * Story: 07.14 - Shipment Status Transitions
 *
 * POST /api/shipping/shipments/:id/exception
 * Transition: any status -> exception (for handling problems)
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

    const body = await request.json()
    const { exception_reason, exception_details } = body

    if (!exception_reason) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_REASON',
            message: 'exception_reason is required',
          },
        },
        { status: 400 }
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

    // Exception can be set from most statuses except "shipped" and "delivered"
    const nonExceptionableStatuses = ['shipped', 'delivered']
    if (nonExceptionableStatuses.includes(shipment.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot mark shipment as exception when status is '${shipment.status}'`,
            current_status: shipment.status,
          },
        },
        { status: 400 }
      )
    }

    const exceptionAt = new Date().toISOString()

    // Update shipment status to "exception"
    const { error: updateError } = await supabase
      .from('shipments')
      .update({
        status: 'exception',
        exception_at: exceptionAt,
        exception_reason,
        exception_details,
        exception_reported_by: userId,
        previous_status: shipment.status,
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
        status: 'exception',
        exception_at: exceptionAt,
        exception_reason,
        previous_status: shipment.status,
      },
    })
  } catch (error) {
    console.error('Error marking shipment as exception:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    )
  }
}
